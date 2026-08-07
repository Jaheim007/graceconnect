/**
 * course-from-document — document → AI course draft pipeline.
 *
 * Extract → segment into topics (original order) → per-topic slide chunks +
 * grounded quiz questions → assemble ordered Lessons → write a DRAFT into
 * `ai_content_projects.data_json.course`. Nothing is written to `programs` /
 * `program_lessons` / `program_slides` here: publishing is a separate, explicit
 * step (`ai-project-to-program`) triggered from the review screen.
 *
 * Cost/size cap: hard word ceiling (DOC_MAX_WORDS) + max MAX_TOPICS AI calls,
 * one per topic. Documents longer than the ceiling are rejected with a clear
 * error; documents inside it are chunked so the call count stays bounded.
 *
 * Certificate/assessment gating (Phase 1 decision): quiz slides produced here
 * are PRACTICE ONLY (`data.scored = false`). They never feed `assessment_score`;
 * certificate eligibility still depends solely on the course-level assessment
 * (`program_quizzes` / `quiz_attempts`) enforced by `issue_program_certificate`.
 */
import { corsHeaders, jsonResp, requireAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { aiGenerateText, extractJson } from '../_shared/ai-fallback.ts';
import {
  extractDocumentText, segmentIntoTopics, countWords, DOC_MAX_WORDS, DOC_MAX_BYTES,
} from '../_shared/doc-extract.ts';
import { consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';

const ACTION_KEY = 'ai_course_structure';
const MAX_TOPICS = 12;            // ⇒ at most 12 AI calls per document
const MIN_SLIDES_PER_TOPIC = 3;
const MAX_SLIDES_PER_TOPIC = 7;
const MAX_QUIZ_PER_TOPIC = 3;
const TOPIC_SOURCE_CHARS = 6000;  // per-call prompt ceiling

interface DraftSlide {
  slide_type: 'text' | 'quiz';
  title: string | null;
  body: string | null;
  data: Record<string, unknown>;
  duration_seconds: number;
}
interface DraftLesson {
  title: string;
  summary: string;
  source_excerpt: string;
  source_page: number | null;
  slides: DraftSlide[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const admin = createClient(auth.supabaseUrl, auth.serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const {
      org_id, source = 'document', file_url, file_name, mime,
      prompt, language, tier, title: titleHint,
    } = body as Record<string, any>;

    if (!org_id) return jsonResp({ error: 'org_id required' }, 400);
    if (source === 'document' && !file_url) return jsonResp({ error: 'file_url required' }, 400);
    if (source === 'prompt' && !prompt) return jsonResp({ error: 'prompt required' }, 400);

    // --- Permission: org owner/admin/editor ---
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', auth.userId)
      .eq('organization_id', org_id)
      .maybeSingle();
    if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
      return jsonResp({ error: 'Forbidden' }, 403);
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) return jsonResp({ error: 'AI not configured' }, 500);
    const openaiKey = Deno.env.get('OPENAI_API_KEY') || undefined;
    const isFr = (language || 'fr') === 'fr';

    // ─── 1. Source text (extraction happens inline so the size cap can be
    //      enforced BEFORE anything is created or charged) ───
    let sourceText = '';
    let sourceKind = 'prompt';
    let sourceWords = 0;

    if (source === 'document') {
      const res = await fetch(file_url);
      if (!res.ok) return jsonResp({ error: 'Could not download the file' }, 400);
      const len = Number(res.headers.get('content-length') || 0);
      if (len && len > DOC_MAX_BYTES) return jsonResp({ error: 'FILE_TOO_LARGE', max_bytes: DOC_MAX_BYTES }, 413);
      const bytes = new Uint8Array(await res.arrayBuffer());

      try {
        const extracted = await extractDocumentText({
          bytes, fileName: file_name || file_url.split('/').pop() || 'document', mime,
        });
        sourceText = extracted.text;
        sourceKind = extracted.kind;
        sourceWords = extracted.words;
      } catch (e) {
        const code = e instanceof Error ? e.message : 'EXTRACTION_FAILED';
        const status = code === 'FILE_TOO_LARGE' ? 413 : 400;
        return jsonResp({ error: code }, status);
      }

      if (sourceWords > DOC_MAX_WORDS) {
        return jsonResp({ error: 'DOCUMENT_TOO_LONG', words: sourceWords, max_words: DOC_MAX_WORDS }, 413);
      }
    }

    // ─── 2. Create the draft project + job ───
    const projectTitle = (titleHint || file_name?.replace(/\.[^.]+$/, '') || prompt?.slice(0, 80) || 'Cours').trim();

    const { data: project, error: projErr } = await admin
      .from('ai_content_projects')
      .insert({
        organization_id: org_id,
        created_by: auth.userId,
        project_type: 'course_pack',
        title: projectTitle,
        status: 'generating',
        language: isFr ? 'fr' : 'en',
        data_json: {
          pipeline: 'course-from-document',
          source: { kind: sourceKind, file_url: file_url || null, file_name: file_name || null, words: sourceWords, prompt: prompt || null },
          course: { title: projectTitle, lessons: [] },
        },
      })
      .select('id')
      .single();
    if (projErr || !project) {
      console.error('[course-from-document] project insert failed', projErr);
      return jsonResp({ error: 'Failed to create draft project' }, 500);
    }

    const { data: job, error: jobErr } = await admin
      .from('ai_generation_jobs')
      .insert({
        organization_id: org_id,
        created_by: auth.userId,
        project_id: project.id,
        job_type: 'generate_full',
        status: 'running',
        provider: 'gemini',
        progress: 5,
        input_params: { source, file_name: file_name || null, words: sourceWords },
        estimated_cost_units: 5,
        result_summary: { step: 'extracting' },
      })
      .select('id')
      .single();
    if (jobErr || !job) {
      console.error('[course-from-document] job insert failed', jobErr);
      return jsonResp({ error: 'Failed to create job' }, 500);
    }

    // ─── 3. Credits (charged once, refunded if the pipeline fails) ───
    let debited = 0;
    try {
      const result = await consumeCreditsOrThrow({
        admin, userId: auth.userId, actionKey: ACTION_KEY, tier: normalizeTier(tier),
        idempotencyKey: `course-from-document:${project.id}`,
        metadata: { project_id: project.id, source },
      });
      debited = 'skipped' in result ? 0 : result.debited;
    } catch (e: any) {
      await admin.from('ai_generation_jobs').update({
        status: 'failed', error_message: e?.message || 'credits', progress: 0,
      }).eq('id', job.id);
      await admin.from('ai_content_projects').update({ status: 'draft' }).eq('id', project.id);
      return jsonResp({ error: e?.message || 'Insufficient credits' }, e?.status === 402 ? 402 : 400);
    }

    // ─── 4. Long work runs in the background; client polls the job ───
    const work = runPipeline({
      admin, geminiKey, openaiKey, isFr,
      projectId: project.id, jobId: job.id, orgId: org_id, userId: auth.userId,
      projectTitle, sourceText, source, prompt, debited,
    });
    // deno-lint-ignore no-explicit-any
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(work);
    else work.catch((e) => console.error('[course-from-document] pipeline error', e));

    return jsonResp({ ok: true, project_id: project.id, job_id: job.id, words: sourceWords });
  } catch (e) {
    console.error('[course-from-document] error', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});

async function setProgress(
  admin: any, jobId: string, progress: number, step: string, extra: Record<string, unknown> = {},
) {
  await admin.from('ai_generation_jobs').update({
    progress: Math.min(99, Math.round(progress)),
    result_summary: { step, ...extra },
  }).eq('id', jobId);
}

async function runPipeline(ctx: {
  admin: any; geminiKey: string; openaiKey?: string; isFr: boolean;
  projectId: string; jobId: string; orgId: string; userId: string;
  projectTitle: string; sourceText: string; source: string; prompt?: string; debited: number;
}) {
  const { admin, isFr } = ctx;
  try {
    let sourceText = ctx.sourceText;

    // Prompt mode: synthesise a source outline first, then run the exact same
    // segmentation + per-topic generation path as a real document.
    if (ctx.source !== 'document') {
      await setProgress(admin, ctx.jobId, 10, 'outlining');
      const outline = await aiGenerateText({
        geminiKey: ctx.geminiKey, openaiKey: ctx.openaiKey,
        model: 'gemini-2.5-flash',
        system: isFr
          ? 'Tu es concepteur pédagogique. Rédige un support de cours structuré, dense et factuel.'
          : 'You are an instructional designer. Write a structured, dense, factual course source document.',
        prompt: isFr
          ? `Rédige un support de cours structuré sur : "${ctx.prompt}".\nUtilise des titres de section en Markdown (## Titre) et 2 à 4 paragraphes de contenu réel sous chaque titre. 6 à 10 sections. Pas d'introduction méta, pas de conclusion générique.`
          : `Write a structured course source document about: "${ctx.prompt}".\nUse Markdown section headings (## Title) with 2-4 paragraphs of real content under each. 6-10 sections. No meta intro, no generic conclusion.`,
        temperature: 0.7,
        maxOutputTokens: 6000,
      });
      sourceText = outline;
    }

    const topics = segmentIntoTopics(sourceText, { maxTopics: MAX_TOPICS });
    await setProgress(admin, ctx.jobId, 15, 'segmenting', { topics: topics.length });

    const lessons: DraftLesson[] = [];
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const excerpt = topic.text.slice(0, TOPIC_SOURCE_CHARS);
      let lesson: DraftLesson;
      try {
        lesson = await generateLesson({
          geminiKey: ctx.geminiKey, openaiKey: ctx.openaiKey, isFr,
          heading: topic.heading, sourceExcerpt: excerpt, index: i,
        });
      } catch (e) {
        console.warn('[course-from-document] topic failed, keeping raw text', i, e);
        lesson = fallbackLesson(topic.heading, excerpt, i, isFr);
      }
      lesson.source_excerpt = excerpt.slice(0, 1200);
      lesson.source_page = topic.page;
      lessons.push(lesson);

      await setProgress(admin, ctx.jobId, 15 + ((i + 1) / topics.length) * 80, 'generating', {
        topics: topics.length, done: i + 1,
      });

      // persist incrementally so a partial draft is never lost
      await admin.from('ai_content_projects').update({
        data_json: await mergeCourse(admin, ctx.projectId, { title: ctx.projectTitle, lessons }),
        updated_at: new Date().toISOString(),
      }).eq('id', ctx.projectId);
    }

    await admin.from('ai_content_projects').update({
      status: 'review', updated_at: new Date().toISOString(),
    }).eq('id', ctx.projectId);

    await admin.from('ai_generation_jobs').update({
      status: 'completed', progress: 100,
      result_summary: {
        step: 'done',
        lessons: lessons.length,
        slides: lessons.reduce((n, l) => n + l.slides.length, 0),
      },
      completed_at: new Date().toISOString(),
    }).eq('id', ctx.jobId);

    await admin.from('audit_logs').insert({
      user_id: ctx.userId,
      action: 'studio.course_draft_generated',
      resource_type: 'ai_content_project',
      resource_id: ctx.projectId,
      organization_id: ctx.orgId,
      metadata: { lessons: lessons.length, source: ctx.source },
    });
  } catch (e) {
    console.error('[course-from-document] pipeline failed', e);
    await admin.from('ai_generation_jobs').update({
      status: 'failed', error_message: (e instanceof Error ? e.message : 'failed').slice(0, 400),
    }).eq('id', ctx.jobId);
    await admin.from('ai_content_projects').update({ status: 'draft' }).eq('id', ctx.projectId);
    if (ctx.debited > 0) {
      try {
        await refundCreditsAsBonus({
          admin, userId: ctx.userId, amount: ctx.debited,
          source: ACTION_KEY, expiresInDays: 30,
        });
      } catch (_) { /* best effort */ }
    }
  }
}

/** Preserve the source block while replacing the generated course tree. */
async function mergeCourse(admin: any, projectId: string, course: unknown) {
  const { data } = await admin.from('ai_content_projects').select('data_json').eq('id', projectId).single();
  return { ...(data?.data_json || {}), course };
}

async function generateLesson(opts: {
  geminiKey: string; openaiKey?: string; isFr: boolean;
  heading: string | null; sourceExcerpt: string; index: number;
}): Promise<DraftLesson> {
  const { isFr } = opts;
  const system = isFr
    ? 'Tu es concepteur pédagogique. Tu transformes un extrait de document en micro-leçon. Tu ne dois JAMAIS inventer de faits absents de l\'extrait. Réponds uniquement en JSON valide.'
    : 'You are an instructional designer turning a document excerpt into a micro-lesson. NEVER invent facts absent from the excerpt. Reply with valid JSON only.';

  const prompt = `${isFr ? 'EXTRAIT SOURCE' : 'SOURCE EXCERPT'} (${isFr ? 'section' : 'section'} ${opts.index + 1}${opts.heading ? ` — ${opts.heading}` : ''}):
"""
${opts.sourceExcerpt}
"""

${isFr ? `Produis un JSON strict :` : `Produce strict JSON:`}
{
  "title": "${isFr ? 'titre court de la leçon (max 60 caractères)' : 'short lesson title (max 60 chars)'}",
  "summary": "${isFr ? 'résumé en 1 phrase' : 'one-sentence summary'}",
  "slides": [
    { "title": "${isFr ? 'titre court' : 'short title'}", "body": "${isFr ? '2 à 4 phrases, texte simple' : '2-4 sentences, plain text'}" }
  ],
  "quiz": [
    { "question": "...", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "${isFr ? 'pourquoi, en citant l\'extrait' : 'why, grounded in the excerpt'}" }
  ]
}

${isFr
  ? `Règles : entre ${MIN_SLIDES_PER_TOPIC} et ${MAX_SLIDES_PER_TOPIC} slides, chacune couvrant une idée de l'extrait, dans l'ordre du document. Entre 1 et ${MAX_QUIZ_PER_TOPIC} questions, dont la réponse est explicitement contenue dans l'extrait. 4 options par question. Français.`
  : `Rules: between ${MIN_SLIDES_PER_TOPIC} and ${MAX_SLIDES_PER_TOPIC} slides, each covering one idea from the excerpt, in document order. Between 1 and ${MAX_QUIZ_PER_TOPIC} questions whose answer is explicitly present in the excerpt. 4 options each. English.`}`;

  const raw = await aiGenerateText({
    geminiKey: opts.geminiKey, openaiKey: opts.openaiKey,
    model: 'gemini-2.5-flash',
    system, prompt, temperature: 0.4, maxOutputTokens: 3000, jsonMode: true,
  });

  const parsed = extractJson(raw) as any;
  const slidesIn = Array.isArray(parsed?.slides) ? parsed.slides : [];
  const quizIn = Array.isArray(parsed?.quiz) ? parsed.quiz : [];

  const slides: DraftSlide[] = slidesIn
    .slice(0, MAX_SLIDES_PER_TOPIC)
    .filter((s: any) => (s?.body || s?.title))
    .map((s: any) => ({
      slide_type: 'text' as const,
      title: s.title ? String(s.title).slice(0, 120) : null,
      body: String(s.body || '').slice(0, 1500),
      data: { source: 'ai_document_pipeline' },
      duration_seconds: 30,
    }));

  for (const q of quizIn.slice(0, MAX_QUIZ_PER_TOPIC)) {
    const options = Array.isArray(q?.options) ? q.options.map((o: any) => String(o)).slice(0, 6) : [];
    if (!q?.question || options.length < 2) continue;
    slides.push({
      slide_type: 'quiz',
      title: String(q.question).slice(0, 200),
      body: null,
      data: {
        kind: 'mcq',
        question: String(q.question),
        options,
        correctIndex: Number.isInteger(q.correctIndex) ? Math.max(0, Math.min(options.length - 1, q.correctIndex)) : 0,
        explanation: q.explanation ? String(q.explanation).slice(0, 500) : undefined,
        // Practice only — never counted towards certificate eligibility.
        scored: false,
        source: 'ai_document_pipeline',
      },
      duration_seconds: 45,
    });
  }

  if (slides.length === 0) throw new Error('EMPTY_LESSON');

  return {
    title: String(parsed?.title || opts.heading || `${isFr ? 'Leçon' : 'Lesson'} ${opts.index + 1}`).slice(0, 120),
    summary: String(parsed?.summary || '').slice(0, 400),
    source_excerpt: '',
    source_page: null,
    slides,
  };
}

/** If the model fails on a topic, keep the real source text as slides. */
function fallbackLesson(heading: string | null, excerpt: string, index: number, isFr: boolean): DraftLesson {
  const paragraphs = excerpt.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf: string[] = [];
  for (const p of paragraphs) {
    buf.push(p);
    if (countWords(buf.join(' ')) > 90) { chunks.push(buf.join('\n\n')); buf = []; }
    if (chunks.length >= MAX_SLIDES_PER_TOPIC) break;
  }
  if (buf.length && chunks.length < MAX_SLIDES_PER_TOPIC) chunks.push(buf.join('\n\n'));

  return {
    title: (heading || `${isFr ? 'Leçon' : 'Lesson'} ${index + 1}`).slice(0, 120),
    summary: '',
    source_excerpt: '',
    source_page: null,
    slides: (chunks.length ? chunks : [excerpt.slice(0, 1200)]).map((body) => ({
      slide_type: 'text' as const,
      title: null,
      body: body.slice(0, 1500),
      data: { source: 'source_fallback' },
      duration_seconds: 30,
    })),
  };
}
