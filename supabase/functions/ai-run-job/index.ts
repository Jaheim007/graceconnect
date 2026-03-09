import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const { job_id } = await req.json();
    if (!job_id) return jsonError('job_id required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Load job ---
    const { data: job, error: jobErr } = await admin
      .from('ai_generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobErr || !job) return jsonError('Job not found', 404);

    // --- Idempotence: already completed ---
    if (job.status === 'completed') {
      return jsonOk({ ok: true, job_id, already_completed: true, result_summary: job.result_summary });
    }
    if (job.status === 'running') {
      return jsonError('Job is already running', 409);
    }

    // --- Permission check ---
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', job.organization_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonError('Forbidden', 403);
    }

    // --- Set running ---
    await admin.from('ai_generation_jobs').update({
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 10,
    }).eq('id', job_id);

    // --- Load template & policy ---
    let template: any = null;
    let policy: any = null;

    if (job.template_id) {
      const { data: t } = await admin.from('ai_templates').select('*').eq('id', job.template_id).single();
      template = t;
      if (t?.policy_profile_id) {
        const { data: p } = await admin.from('ai_policy_profiles').select('*').eq('id', t.policy_profile_id).single();
        policy = p;
      }
    }

    // --- Load project if linked ---
    let project: any = null;
    if (job.project_id) {
      const { data: p } = await admin.from('ai_content_projects').select('*').eq('id', job.project_id).single();
      project = p;
    }

    // --- Policy check on input ---
    const inputParams = job.input_params || {};
    if (policy) {
      const policyResult = checkPolicy(policy, inputParams, '');
      if (!policyResult.allowed) {
        await failJob(admin, job_id, `Policy violation: ${policyResult.reasons.join(', ')}`);
        return jsonError('Policy check failed: ' + policyResult.reasons.join(', '), 422);
      }
    }

    await admin.from('ai_generation_jobs').update({ progress: 30 }).eq('id', job_id);

    // --- Execute based on job_type ---
    try {
      const jobType = job.job_type;
      let output: any = {};
      let assetsCreated: string[] = [];

      if (['text', 'generate_outline', 'generate_chapter', 'generate_description', 'quality_check'].includes(jobType)) {
        // --- Text generation via Gemini ---
        if (!GEMINI_API_KEY) {
          await failJob(admin, job_id, 'GEMINI_API_KEY not configured');
          return jsonError('GEMINI_API_KEY not configured', 500);
        }

        const systemPrompt = buildSystemPrompt(jobType, project, template, inputParams);
        const userPrompt = buildUserPrompt(jobType, project, template, inputParams);

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            }),
          }
        );

        await admin.from('ai_generation_jobs').update({ progress: 70 }).eq('id', job_id);

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error('Gemini error:', geminiRes.status, errText);
          const msg = geminiRes.status === 429
            ? 'Rate limit reached. Retry later.'
            : `Gemini error (${geminiRes.status})`;
          await failJob(admin, job_id, msg);
          return jsonError(msg, 502);
        }

        const geminiData = await geminiRes.json();
        const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        output = processTextOutput(jobType, rawContent, inputParams);

        // --- Store text as asset if substantial ---
        if (rawContent.length > 100 && job.project_id) {
          const storagePath = `${job.organization_id}/${job.project_id}/${job_id}/output.html`;
          const blob = new Blob([output.html || rawContent], { type: 'text/html' });
          await admin.storage.from('org-uploads').upload(storagePath, blob, {
            contentType: 'text/html', upsert: true,
          });
          const { data: asset } = await admin.from('ai_assets').upsert({
            org_id: job.organization_id,
            job_id: job_id,
            project_id: job.project_id,
            asset_type: 'text',
            storage_bucket: 'org-uploads',
            storage_path: storagePath,
            mime_type: 'text/html',
            metadata: { word_count: rawContent.split(/\s+/).length },
          }, { onConflict: 'storage_bucket,storage_path' }).select('id').single();
          if (asset) assetsCreated.push(asset.id);
        }

        // --- Update project structure progressively if applicable ---
        if (project && jobType === 'generate_outline' && output.structure) {
          await applyProgressiveOutlineUpdate(admin, job, job_id, output.structure);
        }

        if (project && jobType === 'generate_chapter' && inputParams?.chapter_id) {
          const finalHtml = output.html || rawContent;
          await applyProgressiveChapterUpdate(admin, job, job_id, inputParams.chapter_id, finalHtml);
        }

        if (project && jobType === 'generate_description') {
          const finalDescription = output.html || rawContent;
          await applyProgressiveDescriptionUpdate(admin, job, job_id, finalDescription);
        }

      } else if (jobType === 'image') {
        // --- Image generation placeholder ---
        output = { message: 'Image generation requires IMAGE_PROVIDER configuration', assets: [] };
      } else if (jobType === 'audio') {
        // --- Audio generation placeholder ---
        output = { message: 'Audio generation requires TTS_PROVIDER configuration', assets: [] };
      }

      await admin.from('ai_generation_jobs').update({ progress: 90 }).eq('id', job_id);

      // --- Quality score ---
      let reviewRequired = policy?.requires_human_review ?? false;
      const qualityScore = computeBasicQuality(output, policy);

      if (job.project_id) {
        await admin.from('ai_quality_scores').insert({
          org_id: job.organization_id,
          job_id: job_id,
          project_id: job.project_id,
          score_overall: qualityScore.score,
          scores_json: qualityScore.details,
          flags_json: qualityScore.flags,
          review_required: reviewRequired,
          review_status: reviewRequired ? 'pending' : 'approved',
        });
      }

      // --- Complete job ---
      const resultSummary = {
        ...output,
        quality_score: qualityScore.score,
        assets_created: assetsCreated,
      };

      await admin.from('ai_generation_jobs').update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        output_data: output,
        result_summary: resultSummary,
      }).eq('id', job_id);

      // --- Update project status ---
      if (job.project_id) {
        const newStatus = reviewRequired ? 'review' : 'ready_to_publish';
        await admin.from('ai_content_projects').update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        }).eq('id', job.project_id);

        // Also update quality fields on project
        if (jobType === 'quality_check') {
          const aiScore = output.score ?? qualityScore.score;
          const aiFlags = output.flags || qualityScore.flags.map((f: any) => f.flag || f);
          await admin.from('ai_content_projects').update({
            quality_score: aiScore,
            quality_flags: aiFlags,
          }).eq('id', job.project_id);
        }
      }

      // --- Audit ---
      await admin.from('audit_logs').insert({
        user_id: user.id,
        action: 'studio.job_completed',
        resource_type: 'ai_generation_job',
        resource_id: job_id,
        organization_id: job.organization_id,
        metadata: { job_type: jobType, quality_score: qualityScore.score },
      });

      return jsonOk({ ok: true, job_id, output: resultSummary });

    } catch (execErr) {
      console.error('Job execution error:', execErr);
      await failJob(admin, job_id, execErr instanceof Error ? execErr.message : 'Execution error');
      return jsonError('Job execution failed', 500);
    }

  } catch (e) {
    console.error('ai-run-job error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

// ============= Helpers =============

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function failJob(admin: any, jobId: string, message: string) {
  await admin.from('ai_generation_jobs').update({
    status: 'failed',
    error_message: message,
    completed_at: new Date().toISOString(),
    progress: 0,
  }).eq('id', jobId);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateJobPartial(admin: any, jobId: string, progress: number, outputData: any) {
  await admin.from('ai_generation_jobs').update({
    progress,
    output_data: outputData,
  }).eq('id', jobId);
}

async function applyProgressiveOutlineUpdate(admin: any, job: any, jobId: string, structure: any) {
  if (!job.project_id || !structure) return;

  const chapters = Array.isArray(structure?.chapters) ? structure.chapters : [];
  if (chapters.length === 0) {
    await admin.from('ai_content_projects').update({
      structure_json: structure,
      data_json: structure,
      updated_at: new Date().toISOString(),
    }).eq('id', job.project_id);
    return;
  }

  for (let i = 1; i <= chapters.length; i++) {
    const partialStructure = {
      ...structure,
      chapters: chapters.slice(0, i).map((ch: any, idx: number) => ({
        ...ch,
        order: ch?.order ?? idx,
        content: ch?.content || '',
      })),
    };

    await admin.from('ai_content_projects').update({
      structure_json: partialStructure,
      data_json: partialStructure,
      updated_at: new Date().toISOString(),
    }).eq('id', job.project_id);

    await updateJobPartial(
      admin,
      jobId,
      70 + Math.floor((i / chapters.length) * 16),
      { structure: partialStructure, partial: i < chapters.length }
    );

    if (i < chapters.length) await sleep(180);
  }
}

async function applyProgressiveChapterUpdate(admin: any, job: any, jobId: string, chapterId: string, finalHtml: string) {
  if (!job.project_id || !chapterId || !finalHtml) return;

  const { data: latestProject } = await admin
    .from('ai_content_projects')
    .select('structure_json')
    .eq('id', job.project_id)
    .single();

  const structure = latestProject?.structure_json as { chapters?: any[] } | null;
  if (!structure?.chapters?.length) return;

  const chunkCount = Math.min(12, Math.max(4, Math.ceil(finalHtml.length / 700)));

  for (let i = 1; i <= chunkCount; i++) {
    const partialHtml = finalHtml.slice(0, Math.ceil((finalHtml.length * i) / chunkCount));
    const updatedChapters = structure.chapters.map((ch: any) =>
      ch.id === chapterId ? { ...ch, content: partialHtml } : ch
    );

    await admin.from('ai_content_projects').update({
      structure_json: { chapters: updatedChapters },
      data_json: { chapters: updatedChapters },
      updated_at: new Date().toISOString(),
    }).eq('id', job.project_id);

    await updateJobPartial(
      admin,
      jobId,
      70 + Math.floor((i / chunkCount) * 16),
      { html: partialHtml, chapter_id: chapterId, partial: i < chunkCount }
    );

    if (i < chunkCount) await sleep(150);
  }
}

async function applyProgressiveDescriptionUpdate(admin: any, job: any, jobId: string, descriptionHtml: string) {
  if (!job.project_id || !descriptionHtml) return;

  const chunkCount = Math.min(8, Math.max(3, Math.ceil(descriptionHtml.length / 500)));

  for (let i = 1; i <= chunkCount; i++) {
    const partialHtml = descriptionHtml.slice(0, Math.ceil((descriptionHtml.length * i) / chunkCount));

    await admin.from('ai_content_projects').update({
      description: stripHtml(partialHtml),
      updated_at: new Date().toISOString(),
    }).eq('id', job.project_id);

    await updateJobPartial(
      admin,
      jobId,
      70 + Math.floor((i / chunkCount) * 16),
      { html: partialHtml, partial: i < chunkCount }
    );

    if (i < chunkCount) await sleep(120);
  }
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkPolicy(policy: any, params: any, content: string): { allowed: boolean; flags: string[]; reasons: string[] } {
  const rules = policy.rules_json || {};
  const flags: string[] = [];
  const reasons: string[] = [];
  const textToCheck = (content + ' ' + JSON.stringify(params)).toLowerCase();

  // Banned words check
  if (rules.banned_words && Array.isArray(rules.banned_words)) {
    for (const word of rules.banned_words) {
      if (textToCheck.includes(word.toLowerCase())) {
        flags.push(`banned_word:${word}`);
        reasons.push(`Contains banned word: ${word}`);
      }
    }
  }

  // Kids safety
  if (rules.max_violence === 0) {
    const violenceWords = ['violence', 'sang', 'mort', 'tuer', 'blood', 'kill', 'murder', 'weapon'];
    for (const w of violenceWords) {
      if (textToCheck.includes(w)) {
        flags.push(`kids_safety:violence`);
        reasons.push(`Content contains violence-related terms`);
        break;
      }
    }
  }

  if (rules.max_sexual === 0) {
    const sexualWords = ['sexuel', 'sexual', 'nude', 'explicit'];
    for (const w of sexualWords) {
      if (textToCheck.includes(w)) {
        flags.push(`kids_safety:sexual`);
        reasons.push(`Content contains inappropriate terms for children`);
        break;
      }
    }
  }

  return {
    allowed: reasons.length === 0,
    flags,
    reasons,
  };
}

function buildSystemPrompt(jobType: string, project: any, template: any, params: any): string {
  // Use template prompt if available
  if (template?.prompt_system) return template.prompt_system;

  const lang = project?.language || params?.language || 'fr';
  const tone = project?.tone || params?.tone || 'professionnel';
  const audience = project?.target_audience || params?.audience || 'adultes';

  const base = `Tu es un ÉCRIVAIN PROFESSIONNEL. Tu rédiges en ${lang === 'fr' ? 'français' : 'English'}.
Ton: ${tone}. Public cible: ${audience}.
FORMAT: Retourne du HTML propre (<p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>). PAS de markdown.

RÈGLES ANTI-IA OBLIGATOIRES :
- Va DROIT AU BUT — pas d'introduction vague ("Dans un monde où...", "Il est important de noter...")
- Utilise des mots SIMPLES et COURANTS — pas de vocabulaire fleuri ou poétique
- Donne des exemples CONCRETS (noms, chiffres, situations réelles)
- Écris comme un VRAI auteur humain, pas comme une IA
- ZÉRO métaphore inutile, ZÉRO dramatisation
- Titres CLAIRS et DESCRIPTIFS, pas créatifs/mystérieux
- Phrases interdites : "Force est de constater", "Au cœur de", "Un voyage extraordinaire", "Tisser les fils de", "Plonger dans les profondeurs", "Transcender", "Sublimer"`;

  if (jobType === 'generate_outline') {
    return `${base}\nRetourne un JSON valide: {"chapters": [{"id": "ch-1", "title": "...", "content": "", "order": 0}]}
Les titres de chapitres doivent être CLAIRS et DESCRIPTIFS — le lecteur doit savoir exactement de quoi parle le chapitre en lisant le titre. PAS de titres poétiques ou mystérieux.`;
  }
  if (jobType === 'quality_check') {
    return `${base}\nTu es un éditeur professionnel. Analyse le contenu chapitre par chapitre et retourne un JSON valide avec cette structure exacte:
{
  "score": 7,
  "summary": "Résumé global de l'analyse en 2-3 phrases",
  "detailed_scores": {
    "structure": 8,
    "style": 7,
    "coherence": 6,
    "originalite": 7,
    "grammaire": 8
  },
  "strengths": ["Point fort 1", "Point fort 2"],
  "weaknesses": ["Point faible 1 avec explication précise"],
  "recommendations": ["Action concrète 1 à effectuer", "Action concrète 2"],
  "chapter_issues": [
    {"chapter": "Titre du chapitre problématique", "score": 5, "issues": ["Problème spécifique 1", "Problème spécifique 2"]},
    {"chapter": "Autre chapitre", "score": 4, "issues": ["Description précise du problème"]}
  ],
  "flags": ["alerte si contenu problématique"]
}
Score de 1 à 10. Pour chapter_issues, liste UNIQUEMENT les chapitres/sections qui ont un score inférieur à 8. VÉRIFIE aussi que le texte ne sonne pas "IA" — signale les passages trop fleuris, les métaphores excessives, les introductions vagues, le ton uniformément enthousiaste.`;
  }

  if (project?.project_type === 'kids_book') {
    return `${base}\nTu écris un livre pour enfants (${project.age_range || '4-8 ans'}). Langage simple, phrases courtes. Personnages avec des NOMS. Dialogues naturels.`;
  }
  if (project?.project_type === 'sermon_pack') {
    return `${base}\nTu rédiges du contenu de prédication. Ton FERME et DIRECT, comme un prédicateur qui parle avec autorité. Versets bibliques avec références complètes. Interpelle le lecteur directement. Pas de poésie ni de douceur excessive.`;
  }

  return base;
}

function buildUserPrompt(jobType: string, project: any, template: any, params: any): string {
  // Use template pattern if available, substituting variables
  if (template?.prompt_user_pattern) {
    let prompt = template.prompt_user_pattern;
    const allParams = { ...project, ...params };
    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      } else if (Array.isArray(value)) {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value.join(', '));
      }
    }
    // Clean remaining placeholders
    prompt = prompt.replace(/\{\{[^}]+\}\}/g, 'non spécifié');
    return prompt;
  }

  const title = project?.title || params?.title || 'Contenu';
  const objective = project?.objective || params?.objective || '';

  switch (jobType) {
    case 'generate_outline':
      return `Génère un plan détaillé pour: "${title}". Objectif: ${objective}. Longueur: ${project?.target_length || 10} chapitres.`;
    case 'generate_chapter': {
      if (params?.mode === 'improve') {
        const issues = params.issues ? `\nProblèmes identifiés: ${params.issues}` : '';
        return `Améliore et réécris le chapitre "${params.chapter_title || 'Chapitre'}" du projet "${title}".${issues}\n\nContenu actuel à améliorer:\n${params.current_content || '(contenu vide - rédige le chapitre complet)'}\n\nConsignes: Corrige les problèmes identifiés, enrichis le contenu, améliore le style et la structure. Garde le même thème et le même titre. Produis un contenu complet de 500-800 mots en HTML.`;
      }
      return `Rédige le chapitre "${params?.chapter_title || 'Chapitre'}". Projet: "${title}". 500-800 mots.`;
    }
    case 'generate_description': {
      const chaptersForDesc = (project?.structure_json as any)?.chapters || [];
      const chapterTitles = chaptersForDesc.map((c: any) => c.title).filter(Boolean).join(', ');
      const firstChapterPreview = chaptersForDesc[0]?.content?.slice(0, 500) || '';
      return `Tu es un copywriter expert. Rédige une description de vente percutante et professionnelle pour le livre/contenu intitulé "${title}".

${objective ? `Objectif du livre: ${objective}` : ''}
${chapterTitles ? `Chapitres: ${chapterTitles}` : ''}
${firstChapterPreview ? `Aperçu du contenu: ${firstChapterPreview.slice(0, 300)}...` : ''}

Consignes:
- 150-250 mots maximum
- Commence par une accroche forte qui capte l'attention
- Mets en avant 3-4 bénéfices concrets pour le lecteur
- Utilise un ton professionnel mais engageant
- Termine par un appel à l'action subtil
- N'utilise PAS de balises HTML, retourne du texte brut
- Ne commence pas par "Découvrez" ou "Ce livre"
- Sois original et spécifique au contenu du livre`;
    }
    case 'quality_check': {
      const chapters = (project?.structure_json as any)?.chapters || [];
      const allContent = chapters.map((c: any) => `## ${c.title}\n${c.content}`).join('\n\n');
      return `Analyse ce contenu:\nTitre: ${title}\n\n${allContent.slice(0, 8000)}`;
    }
    default:
      return `Rédige du contenu pour "${title}". ${params?.custom_prompt || ''}`;
  }
}

function processTextOutput(jobType: string, rawContent: string, params: any): any {
  // Strip all code fences (```json, ```html, ```, etc.)
  const cleaned = rawContent
    .replace(/```[\w]*\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  if (jobType === 'generate_outline' || jobType === 'quality_check') {
    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (jobType === 'generate_outline') return { structure: parsed, html: '' };
        return parsed;
      }
    } catch (e) {
      console.error('JSON parse error in processTextOutput:', e);
    }
  }

  const html = cleaned;

  return { html, chapter_id: params?.chapter_id };
}

function computeBasicQuality(output: any, policy: any): { score: number; details: any; flags: any[] } {
  const flags: any[] = [];
  let score = 7; // Base score

  const content = output.html || output.summary || JSON.stringify(output);
  const wordCount = content.split(/\s+/).length;

  // Length check
  if (wordCount < 50) {
    score -= 2;
    flags.push({ flag: 'too_short', detail: `Only ${wordCount} words` });
  } else if (wordCount > 200) {
    score += 1;
  }

  // Structure check (has headings)
  if (content.includes('<h2') || content.includes('<h3')) {
    score += 1;
  } else if (wordCount > 300) {
    flags.push({ flag: 'no_structure', detail: 'Long content without headings' });
  }

  // Policy flags check on output
  if (policy) {
    const policyResult = checkPolicy(policy, {}, content);
    if (!policyResult.allowed) {
      score -= 3;
      flags.push(...policyResult.flags.map(f => ({ flag: f, detail: 'Policy violation in output' })));
    }
  }

  score = Math.max(1, Math.min(10, score));

  return {
    score,
    details: { word_count: wordCount, has_structure: content.includes('<h2') },
    flags,
  };
}
