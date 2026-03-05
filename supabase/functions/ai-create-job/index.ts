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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { project_id, job_type, input_params } = await req.json();
    if (!project_id || !job_type) {
      return new Response(JSON.stringify({ error: 'project_id and job_type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch project
    const { data: project, error: projErr } = await admin
      .from('ai_content_projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access to org
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', project.organization_id)
      .maybeSingle();

    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create job record
    const { data: job, error: jobErr } = await admin
      .from('ai_generation_jobs')
      .insert({
        project_id,
        organization_id: project.organization_id,
        created_by: user.id,
        job_type,
        status: 'running',
        started_at: new Date().toISOString(),
        progress: 10,
        input_params: input_params || {},
      })
      .select()
      .single();

    if (jobErr) {
      console.error('Job creation error:', jobErr);
      return new Response(JSON.stringify({ error: 'Failed to create job' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update project status to generating
    if (project.status === 'draft') {
      await admin.from('ai_content_projects').update({ status: 'generating' }).eq('id', project_id);
    }

    // Build prompt based on job_type
    const prompt = buildPrompt(job_type, project, input_params || {});

    // Update progress
    await admin.from('ai_generation_jobs').update({ progress: 30 }).eq('id', job.id);

    // Call Gemini
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: getSystemPrompt(job_type, project) }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
        }
      );

      await admin.from('ai_generation_jobs').update({ progress: 70 }).eq('id', job.id);

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('Gemini error:', geminiRes.status, errText);
        
        await admin.from('ai_generation_jobs').update({
          status: 'failed',
          error_message: geminiRes.status === 429 ? 'Limite de requêtes atteinte. Réessayez dans quelques instants.' : `Erreur Gemini (${geminiRes.status})`,
          completed_at: new Date().toISOString(),
          progress: 0,
        }).eq('id', job.id);

        return new Response(JSON.stringify({ error: 'AI generation failed', job_id: job.id }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const geminiData = await geminiRes.json();
      const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      await admin.from('ai_generation_jobs').update({ progress: 90 }).eq('id', job.id);

      // Process output based on job_type
      const outputData = processOutput(job_type, content, input_params || {});

      // Update job as completed
      await admin.from('ai_generation_jobs').update({
        status: 'completed',
        output_data: outputData,
        progress: 100,
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);

      // If generate_chapter, update project structure_json
      if (job_type === 'generate_chapter' && input_params?.chapter_id) {
        const { data: latestProject } = await admin
          .from('ai_content_projects')
          .select('structure_json')
          .eq('id', project_id)
          .single();

        if (latestProject?.structure_json) {
          const structure = latestProject.structure_json as { chapters?: any[] };
          if (structure.chapters) {
            const updatedChapters = structure.chapters.map((ch: any) =>
              ch.id === input_params.chapter_id
                ? { ...ch, content: outputData.html || content }
                : ch
            );
            await admin.from('ai_content_projects').update({
              structure_json: { chapters: updatedChapters },
              updated_at: new Date().toISOString(),
            }).eq('id', project_id);
          }
        }
      }

      // If generate_outline, create chapters in structure_json
      if (job_type === 'generate_outline') {
        await admin.from('ai_content_projects').update({
          structure_json: outputData.structure || { chapters: [] },
          updated_at: new Date().toISOString(),
        }).eq('id', project_id);
      }

      // Quality check: simple heuristic
      if (job_type === 'quality_check') {
        const score = outputData.score || 7;
        const flags = outputData.flags || [];
        await admin.from('ai_content_projects').update({
          quality_score: score,
          quality_flags: flags,
          status: 'review',
          updated_at: new Date().toISOString(),
        }).eq('id', project_id);
      }

      return new Response(JSON.stringify({ 
        ok: true, 
        job_id: job.id, 
        output: outputData 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (aiErr) {
      console.error('AI call error:', aiErr);
      await admin.from('ai_generation_jobs').update({
        status: 'failed',
        error_message: aiErr instanceof Error ? aiErr.message : 'Unknown AI error',
        completed_at: new Date().toISOString(),
        progress: 0,
      }).eq('id', job.id);

      return new Response(JSON.stringify({ error: 'AI generation failed', job_id: job.id }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (e) {
    console.error('ai-create-job error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemPrompt(jobType: string, project: any): string {
  const base = `Tu es un rédacteur expert et créatif. Tu rédiges en ${project.language || 'français'}.
Ton: ${project.tone || 'professionnel'}.
Public cible: ${project.target_audience || 'adultes'}.

FORMAT: Tu DOIS retourner du HTML propre (<p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>). PAS de markdown.
- N'utilise JAMAIS de markdown (** * # \`\`\`).
- Ne commence JAMAIS par "Voici..." ou une intro méta.
- Va droit au contenu.`;

  if (jobType === 'generate_outline') {
    return `${base}
Tu génères un plan de contenu structuré. Retourne un JSON valide (PAS de HTML pour cette tâche) avec le format:
{"chapters": [{"id": "uuid", "title": "Titre", "content": "", "order": 0}]}
Chaque chapitre doit avoir un UUID unique (utilise un format simple comme "ch-1", "ch-2", etc.).
Génère entre 5 et ${project.target_length || 10} chapitres.`;
  }

  if (jobType === 'quality_check') {
    return `${base}
Tu analyses la qualité du contenu. Retourne un JSON valide:
{"score": 8, "flags": ["flag1", "flag2"], "summary": "Résumé de l'analyse"}
Score de 1 à 10. Flags = problèmes détectés. Sois constructif.`;
  }

  if (project.project_type === 'kids_book') {
    return `${base}
Tu écris un livre pour enfants (${project.age_range || '4-8 ans'}).
Style: ${project.art_style || 'coloré et joyeux'}.
Personnages: ${project.characters || 'à définir'}.
Morale: ${project.moral || 'une belle leçon de vie'}.
Utilise un langage simple, des phrases courtes, et beaucoup d'imagination.`;
  }

  if (project.project_type === 'sermon_pack') {
    return `${base}
Tu rédiges un contenu de prédication/enseignement spirituel.
Thème: ${project.sermon_theme || 'à définir'}.
Texte de base: ${project.sermon_text || 'non spécifié'}.
Points clés: ${JSON.stringify(project.sermon_points || [])}.
Sois profond, inspirant et ancré dans les Écritures.`;
  }

  return base;
}

function buildPrompt(jobType: string, project: any, params: any): string {
  switch (jobType) {
    case 'generate_outline':
      return `Génère un plan détaillé pour : "${project.title}".
Objectif: ${project.objective || 'Créer un contenu de qualité'}.
Mots-clés: ${(project.keywords || []).join(', ') || 'aucun'}.
Longueur cible: ${project.target_length || 10} chapitres/pages.`;

    case 'generate_chapter':
      return `Rédige le contenu complet du chapitre "${params.chapter_title || 'Chapitre'}".
Contexte du projet: "${project.title}" - ${project.objective || ''}.
${params.chapter_context ? `Contexte additionnel: ${params.chapter_context}` : ''}
Longueur: environ 500-800 mots.
Rédige un contenu riche, engageant et bien structuré.`;

    case 'generate_description':
      return `Rédige une description de vente percutante pour le produit "${project.title}".
Objectif: ${project.objective || ''}.
Public: ${project.target_audience || 'adultes'}.
Inclus des bénéfices clairs, un appel à l'action, et des emojis pertinents.
Maximum 200 mots.`;

    case 'quality_check': {
      const chapters = (project.structure_json as any)?.chapters || [];
      const allContent = chapters.map((c: any) => `## ${c.title}\n${c.content}`).join('\n\n');
      return `Analyse la qualité de ce contenu et donne un score de 1 à 10 avec des flags de problèmes:
      
Titre: ${project.title}
Type: ${project.project_type}

Contenu:
${allContent.slice(0, 8000)}

Critères: cohérence, qualité rédactionnelle, engagement, structure, pertinence pour le public cible (${project.target_audience || 'adultes'}).
${project.project_type === 'kids_book' ? 'CRITIQUE: Vérifie la sécurité et l\'adéquation pour les enfants.' : ''}`;
    }

    default:
      return `Rédige du contenu pour le projet "${project.title}". ${params.custom_prompt || ''}`;
  }
}

function processOutput(jobType: string, rawContent: string, params: any): any {
  // For JSON-returning jobs, try to parse
  if (jobType === 'generate_outline' || jobType === 'quality_check') {
    try {
      // Extract JSON from potential code blocks
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (jobType === 'generate_outline') {
          return { structure: parsed };
        }
        return parsed;
      }
    } catch {
      console.error('Failed to parse JSON output, returning raw');
    }
  }

  // Clean HTML output
  let html = rawContent
    .replace(/```html?\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  return { html, chapter_id: params.chapter_id };
}
