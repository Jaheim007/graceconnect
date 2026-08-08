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
import { aiGenerateText, extractJson, aiGenerateImageBase64 } from '../_shared/ai-fallback.ts';
import {
  extractDocumentText, segmentIntoTopics, countWords, DOC_MAX_WORDS, DOC_MAX_BYTES,
} from '../_shared/doc-extract.ts';
import { consumeCreditsOrThrow, refundCreditsAsBonus, normalizeTier } from '../_shared/credits.ts';

const ACTION_KEY = 'ai_course_structure';
const IMAGE_ACTION_KEY = 'generate_illustration';
const TOPIC_SOURCE_CHARS = 9000;  // per-call prompt ceiling

/**
 * Wall-clock safety net. Background isolates are killed without warning, which
 * used to leave a job frozen at "82%" forever and a draft the creator could
 * never finish. We now stop generating BEFORE the kill and finalise the draft
 * with whatever lessons exist, so nothing is ever lost.
 */
const PIPELINE_SOFT_DEADLINE_MS = 340_000;
/** Below this remaining budget we stop spending time (and credits) on images. */
const IMAGE_MIN_REMAINING_MS = 30_000;
/**
 * Images used to die around lesson 9-10: the lesson loop ate the wall clock and
 * the inline image step was skipped for every later batch. Illustrations now get
 * their own tail budget AFTER all lessons are written, so late lessons are
 * illustrated too.
 */
const IMAGE_TAIL_DEADLINE_MS = 370_000;
const IMAGE_TAIL_BATCH = 4;



/**
 * Tier profiles — this is what actually makes Standard ≠ Premium.
 * Standard: solid course, flash model, fewer/leaner lessons, images on the
 * first lessons only. Premium: deeper lessons (more slides, longer bodies,
 * examples + key takeaways), more topics, stronger model, an image on every
 * lesson.
 */
interface TierProfile {
  maxTopics: number;
  /** Never deliver fewer lessons than this when the source allows it. */
  minTopics: number;
  minSlides: number;
  maxSlides: number;
  minQuiz: number;
  maxQuiz: number;
  /** Practice flashcards inserted between the teaching slides. */
  minFlashcards: number;
  maxFlashcards: number;
  sentencesFr: string;
  sentencesEn: string;
  /** Target words per teaching slide (microlearning: one idea, no scrolling). */
  slideWordsMin: number;
  slideWordsMax: number;
  model: string;
  maxOutputTokens: number;
  outlineSections: string;
  maxImages: number;
  bodyChars: number;
}

const TIER_PROFILES: Record<'standard' | 'premium', TierProfile> = {
  standard: {
    maxTopics: 12,
    minTopics: 8,
    minSlides: 12,
    maxSlides: 20,
    minQuiz: 5,
    maxQuiz: 6,
    minFlashcards: 3,
    maxFlashcards: 4,
    sentencesFr: '2 à 4 phrases courtes (40 à 80 mots maximum), une seule idée par slide',
    sentencesEn: '2-4 short sentences (40-80 words max), one single idea per slide',
    slideWordsMin: 40,
    slideWordsMax: 80,
    model: 'gemini-2.5-flash',
    maxOutputTokens: 12000,
    outlineSections: '10-12',
    maxImages: 12,
    bodyChars: 900,
  },
  premium: {
    maxTopics: 18,
    minTopics: 14,
    minSlides: 18,
    maxSlides: 28,
    minQuiz: 8,
    maxQuiz: 10,
    minFlashcards: 5,
    maxFlashcards: 6,
    sentencesFr: '3 à 5 phrases courtes (60 à 100 mots maximum), une seule idée par slide, avec un exemple concret quand c\'est utile',
    sentencesEn: '3-5 short sentences (60-100 words max), one single idea per slide, with a concrete example where useful',
    slideWordsMin: 60,
    slideWordsMax: 100,
    model: 'gemini-2.5-pro',
    maxOutputTokens: 20000,
    outlineSections: '14-18',
    maxImages: 18,
    bodyChars: 1200,
  },
};


interface DraftSlide {
  slide_type: 'text' | 'quiz' | 'flashcard';
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
  image_url?: string | null;
  image_prompt?: string | null;
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
      prompt, language, tier, title: titleHint, generate_images, level,
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
          generation: { tier: normalizeTier(tier), level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'intermediate' },
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
      tier: normalizeTier(tier) === 'premium' ? 'premium' : 'standard',
      generateImages: generate_images === true,
      level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'intermediate',

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
  tier: 'standard' | 'premium';
  /** Images are OPT-IN: only generated (and credit-debited) when the creator asked for them. */
  generateImages: boolean;
  /** Drives quiz difficulty (and how many questions a lesson gets). */
  level: 'beginner' | 'intermediate' | 'advanced';
}) {
  const { admin, isFr } = ctx;
  const profile = TIER_PROFILES[ctx.tier];
  let imagesEnabled = ctx.generateImages === true;

  let imagesGenerated = 0;

  try {
    let sourceText = ctx.sourceText;

    // Prompt mode: synthesise a source outline first, then run the exact same
    // segmentation + per-topic generation path as a real document.
    if (ctx.source !== 'document') {
      await setProgress(admin, ctx.jobId, 10, 'outlining');
      const outline = await aiGenerateText({
        geminiKey: ctx.geminiKey, openaiKey: ctx.openaiKey,
        model: profile.model,
        system: isFr
          ? 'Tu es concepteur pédagogique. Rédige un support de cours structuré, dense et factuel.'
          : 'You are an instructional designer. Write a structured, dense, factual course source document.',
        prompt: isFr
          ? `Rédige un support de cours structuré et approfondi sur : "${ctx.prompt}".\nUtilise des titres de section en Markdown (## Titre) et 3 à 5 paragraphes de contenu réel et détaillé sous chaque titre (définitions, exemples concrets, chiffres, cas pratiques). ${profile.outlineSections} sections. Pas d'introduction méta, pas de conclusion générique.`
          : `Write a structured, in-depth course source document about: "${ctx.prompt}".\nUse Markdown section headings (## Title) with 3-5 paragraphs of real, detailed content under each (definitions, concrete examples, figures, practical cases). ${profile.outlineSections} sections. No meta intro, no generic conclusion.`,
        temperature: 0.7,
        maxOutputTokens: profile.maxOutputTokens,
      });
      sourceText = outline;
    }

    let topics = segmentIntoTopics(sourceText, { maxTopics: profile.maxTopics });

    // The tier promise is a LESSON COUNT. A short/merged outline used to leave a
    // premium course with 5 lessons. If segmentation under-delivers in prompt
    // mode, ask for a titles-only plan and build one topic per title.
    if (ctx.source !== 'document' && topics.length < profile.minTopics) {
      try {
        const planRaw = await aiGenerateText({
          geminiKey: ctx.geminiKey, openaiKey: ctx.openaiKey,
          model: profile.model,
          system: isFr
            ? 'Tu es concepteur pédagogique. Réponds uniquement en JSON valide.'
            : 'You are an instructional designer. Reply with valid JSON only.',
          prompt: isFr
            ? `Plan de cours sur "${ctx.prompt}". Renvoie exactement ${profile.maxTopics} titres de leçons progressifs, sans doublon : {"lessons":["titre 1", ...]}`
            : `Course plan about "${ctx.prompt}". Return exactly ${profile.maxTopics} progressive, non-duplicate lesson titles: {"lessons":["title 1", ...]}`,
          temperature: 0.6, maxOutputTokens: 1200, jsonMode: true,
        });
        const titles: string[] = ((extractJson(planRaw) as any)?.lessons || [])
          .map((t: any) => String(t).slice(0, 120)).filter(Boolean).slice(0, profile.maxTopics);
        if (titles.length > topics.length) {
          topics = titles.map((heading, i) => ({
            index: i,
            heading,
            page: null,
            text: `${isFr ? 'SUJET DU COURS' : 'COURSE SUBJECT'}: ${ctx.prompt}\n\n${isFr ? 'LEÇON' : 'LESSON'} ${i + 1}: ${heading}\n\n${sourceText.slice(0, 4000)}`,
          })) as typeof topics;
        }
      } catch (e) {
        console.warn('[course-from-document] titles-only plan failed', e);
      }
    }

    await setProgress(admin, ctx.jobId, 15, 'segmenting', { topics: topics.length, tier: ctx.tier });


    const startedAt = Date.now();
    const remainingMs = () => PIPELINE_SOFT_DEADLINE_MS - (Date.now() - startedAt);

    const lessons: DraftLesson[] = [];
    let truncated = false;

    // Lessons are generated in small parallel batches: a premium course (18
    // topics on a slower model) used to hit the wall clock after ~5 lessons.
    const BATCH = 4;
    let done = 0;

    for (let start = 0; start < topics.length; start += BATCH) {
      // Wall-clock guard: finalise instead of getting killed mid-run.
      if (start > 0 && remainingMs() <= 30_000) {
        truncated = true;
        console.warn('[course-from-document] soft deadline reached, finalising partial draft', { done, topics: topics.length });
        break;
      }

      const batch = topics.slice(start, start + BATCH);
      const generated = await Promise.all(batch.map(async (topic, k) => {
        const i = start + k;
        const excerpt = topic.text.slice(0, TOPIC_SOURCE_CHARS);
        let lesson: DraftLesson;
        try {
          lesson = await generateLesson({
            geminiKey: ctx.geminiKey, openaiKey: ctx.openaiKey, isFr,
            heading: topic.heading, sourceExcerpt: excerpt, index: i, profile, level: ctx.level,
          });
        } catch (e) {
          console.warn('[course-from-document] topic failed, keeping raw text', i, e);
          lesson = fallbackLesson(topic.heading, excerpt, i, isFr, profile);
        }
        lesson.source_excerpt = excerpt.slice(0, 1200);
        lesson.source_page = topic.page;
        return lesson;
      }));

      // ── Lesson background images (credit-debited, best effort) ──
      // Generated in PARALLEL for the batch. When the wall clock is tight we do
      // NOT disable images for the rest of the run — the missing ones are picked
      // up by the tail pass below.
      if (imagesEnabled && remainingMs() > IMAGE_MIN_REMAINING_MS) {
        const eligible = generated
          .map((lesson, k) => ({ lesson, index: start + k }))
          .filter((_, k) => imagesGenerated + k < profile.maxImages);

        const results = await Promise.all(eligible.map(({ lesson, index }) =>
          generateLessonImage({ admin, ctx, lesson, index, profile })
            .catch((e) => { console.warn('[course-from-document] image failed', index, e); return { url: null, stop: false }; }),
        ));

        results.forEach((result, k) => {
          if (result.url) { eligible[k].lesson.image_url = result.url; imagesGenerated += 1; }
          if (result.stop) imagesEnabled = false;
        });
      }



      lessons.push(...generated);
      done = lessons.length;

      await setProgress(admin, ctx.jobId, 15 + (done / topics.length) * 80, 'generating', {
        topics: topics.length, done, tier: ctx.tier, images: imagesGenerated,
      });

      // persist incrementally so a partial draft is never lost
      await admin.from('ai_content_projects').update({
        data_json: await mergeCourse(admin, ctx.projectId, { title: ctx.projectTitle, lessons }),
        updated_at: new Date().toISOString(),
      }).eq('id', ctx.projectId);
    }

    // Do not silently downgrade a paid tier when the runtime deadline is hit.
    // Preserve the remaining source as concise, editable lessons so Standard
    // always has 8+ lessons and Premium always has 14+ lessons.
    if (lessons.length < profile.minTopics) {
      const missingTopics = topics.slice(lessons.length, profile.minTopics);
      missingTopics.forEach((topic) => {
        lessons.push(fallbackLesson(topic.heading, topic.text.slice(0, TOPIC_SOURCE_CHARS), lessons.length, isFr, profile));
      });
      truncated = true;
      await admin.from('ai_content_projects').update({
        data_json: await mergeCourse(admin, ctx.projectId, { title: ctx.projectTitle, lessons }),
        updated_at: new Date().toISOString(),
      }).eq('id', ctx.projectId);
    }

    // ── Image tail pass: illustrate every lesson still missing a backdrop ──
    if (imagesEnabled) {
      const tailStart = Date.now();
      const tailRemaining = () => IMAGE_TAIL_DEADLINE_MS - (Date.now() - startedAt);
      const missing = lessons
        .map((lesson, index) => ({ lesson, index }))
        .filter(({ lesson }) => !lesson.image_url);

      for (let start = 0; start < missing.length; start += IMAGE_TAIL_BATCH) {
        if (!imagesEnabled) break;
        if (imagesGenerated >= profile.maxImages) break;
        if (tailRemaining() <= IMAGE_MIN_REMAINING_MS) {
          console.warn('[course-from-document] image tail budget exhausted', { imagesGenerated, missing: missing.length });
          break;
        }

        const batch = missing
          .slice(start, start + IMAGE_TAIL_BATCH)
          .filter((_, k) => imagesGenerated + k < profile.maxImages);
        if (!batch.length) break;

        const results = await Promise.all(batch.map(({ lesson, index }) =>
          generateLessonImage({ admin, ctx, lesson, index, profile })
            .catch((e) => { console.warn('[course-from-document] tail image failed', index, e); return { url: null, stop: false }; }),
        ));

        results.forEach((result, k) => {
          if (result.url) { batch[k].lesson.image_url = result.url; imagesGenerated += 1; }
          if (result.stop) imagesEnabled = false;
        });

        await admin.from('ai_content_projects').update({
          data_json: await mergeCourse(admin, ctx.projectId, { title: ctx.projectTitle, lessons }),
          updated_at: new Date().toISOString(),
        }).eq('id', ctx.projectId);
      }
      console.log('[course-from-document] image tail done', { imagesGenerated, ms: Date.now() - tailStart });
    }





    await admin.from('ai_content_projects').update({
      status: 'review', updated_at: new Date().toISOString(),
    }).eq('id', ctx.projectId);

    await admin.from('ai_generation_jobs').update({
      status: 'completed', progress: 100,
      result_summary: {
        step: 'done',
        tier: ctx.tier,
        lessons: lessons.length,
        slides: lessons.reduce((n, l) => n + l.slides.length, 0),
        images: imagesGenerated,
        truncated,
        planned_lessons: topics.length,
      },
      completed_at: new Date().toISOString(),
    }).eq('id', ctx.jobId);


    await admin.from('audit_logs').insert({
      user_id: ctx.userId,
      action: 'studio.course_draft_generated',
      resource_type: 'ai_content_project',
      resource_id: ctx.projectId,
      organization_id: ctx.orgId,
      metadata: { lessons: lessons.length, source: ctx.source, tier: ctx.tier, images: imagesGenerated },
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

const LEVEL_RULES: Record<'beginner' | 'intermediate' | 'advanced', { fr: string; en: string; quizBonus: number }> = {
  beginner: {
    fr: 'Public débutant : questions de compréhension simples (définitions, faits explicites), vocabulaire accessible.',
    en: 'Beginner audience: simple comprehension questions (definitions, explicit facts), accessible vocabulary.',
    quizBonus: -1,
  },
  intermediate: {
    fr: 'Public intermédiaire : questions d\'application (choisir la bonne pratique dans une situation donnée).',
    en: 'Intermediate audience: application questions (pick the right practice in a given situation).',
    quizBonus: 0,
  },
  advanced: {
    fr: 'Public avancé : questions d\'analyse et de nuance (distinguer deux approches proches, cas limites).',
    en: 'Advanced audience: analysis and nuance questions (distinguish two close approaches, edge cases).',
    quizBonus: 1,
  },
};

async function generateLesson(opts: {
  geminiKey: string; openaiKey?: string; isFr: boolean;
  heading: string | null; sourceExcerpt: string; index: number; profile: TierProfile;
  level: 'beginner' | 'intermediate' | 'advanced';
}): Promise<DraftLesson> {
  const { isFr, profile } = opts;
  const levelRule = LEVEL_RULES[opts.level] || LEVEL_RULES.intermediate;
  // Quiz count never drops below the tier floor: threshold gating (e.g. 70%)
  // needs at least 5 questions to be expressible in score increments.
  const quizCount = Math.min(
    profile.maxQuiz,
    Math.max(profile.minQuiz, profile.minQuiz + Math.max(0, levelRule.quizBonus)),
  );
  const cardCount = profile.minFlashcards;
  const system = isFr
    ? 'Tu es concepteur pédagogique. Tu transformes un extrait de document en leçon complète et riche. Tu ne dois JAMAIS inventer de faits absents de l\'extrait, mais tu dois développer, expliquer et illustrer chaque idée présente. Réponds uniquement en JSON valide.'
    : 'You are an instructional designer turning a document excerpt into a complete, rich lesson. NEVER invent facts absent from the excerpt, but do develop, explain and illustrate every idea present. Reply with valid JSON only.';

  const prompt = `${isFr ? 'EXTRAIT SOURCE' : 'SOURCE EXCERPT'} (${isFr ? 'section' : 'section'} ${opts.index + 1}${opts.heading ? ` — ${opts.heading}` : ''}):
"""
${opts.sourceExcerpt}
"""

${isFr ? `Produis un JSON strict :` : `Produce strict JSON:`}
{
  "title": "${isFr ? 'titre court de la leçon (max 60 caractères)' : 'short lesson title (max 60 chars)'}",
  "summary": "${isFr ? 'résumé en 1 à 2 phrases' : 'one- to two-sentence summary'}",
  "image_prompt": "${isFr ? 'description visuelle en anglais d\'une image d\'illustration pour cette leçon (scène, sujet, ambiance) — sans texte dans l\'image' : 'English visual description of an illustration for this lesson (scene, subject, mood) — no text in the image'}",
  "slides": [
    { "title": "${isFr ? 'titre court' : 'short title'}", "body": "${isFr ? profile.sentencesFr : profile.sentencesEn}" }
  ],
  "flashcards": [
    { "front": "${isFr ? 'notion ou question courte' : 'short notion or question'}", "back": "${isFr ? 'explication claire en 1 à 3 phrases' : 'clear 1-3 sentence explanation'}" }
  ],
  "quiz": [
    { "question": "...", "options": ["a","b","c","d"], "correctIndex": 0, "explanation": "${isFr ? 'pourquoi, en citant l\'extrait' : 'why, grounded in the excerpt'}" }
  ]
}

${isFr
  ? `Règles : entre ${profile.minSlides} et ${profile.maxSlides} slides. FORMAT MICRO-APPRENTISSAGE : une seule idée par slide, ${profile.slideWordsMin} à ${profile.slideWordsMax} mots maximum par "body" (${profile.sentencesFr}) — le texte doit tenir sur un écran de téléphone sans défilement. Ne condense pas : couvre tout l'extrait en découpant en PLUS de slides courtes plutôt qu'en slides longues. Explique, définis les termes, donne des exemples issus de l'extrait. Entre ${profile.minFlashcards} et ${profile.maxFlashcards} cartes mémo (flashcards) qui font réviser les notions clés (au moins ${cardCount}). Exactement ${quizCount} questions de quiz dont la réponse est explicitement contenue dans l'extrait, 4 options par question. ${levelRule.fr} Français.`
  : `Rules: between ${profile.minSlides} and ${profile.maxSlides} slides. MICROLEARNING FORMAT: one single idea per slide, ${profile.slideWordsMin}-${profile.slideWordsMax} words max per "body" (${profile.sentencesEn}) — the text must fit one phone screen with no scrolling. Do not condense: cover the whole excerpt by splitting into MORE short slides rather than fewer long ones. Explain, define terms, give examples drawn from the excerpt. Between ${profile.minFlashcards} and ${profile.maxFlashcards} flashcards revising the lesson's key notions (at least ${cardCount}). Exactly ${quizCount} quiz questions whose answer is explicitly present in the excerpt, 4 options each. ${levelRule.en} English.`}`;

  const raw = await aiGenerateText({
    geminiKey: opts.geminiKey, openaiKey: opts.openaiKey,
    model: profile.model,
    system, prompt, temperature: 0.5, maxOutputTokens: profile.maxOutputTokens, jsonMode: true,
  });

  const parsed = extractJson(raw) as any;
  const slidesIn = Array.isArray(parsed?.slides) ? parsed.slides : [];
  const quizIn = Array.isArray(parsed?.quiz) ? parsed.quiz : [];
  const cardsIn = Array.isArray(parsed?.flashcards) ? parsed.flashcards : [];

  const textSlides: DraftSlide[] = slidesIn
    .slice(0, profile.maxSlides)
    .filter((s: any) => (s?.body || s?.title))
    .map((s: any) => ({
      slide_type: 'text' as const,
      title: s.title ? String(s.title).slice(0, 120) : null,
      body: String(s.body || '').slice(0, profile.bodyChars),
      data: { source: 'ai_document_pipeline' },
      duration_seconds: 30,
    }));

  // Flashcards are PRACTICE: they sit between the teaching slides and always
  // show their answer, so the learner can self-check before the graded quiz.
  const cards: DraftSlide[] = cardsIn
    .slice(0, profile.maxFlashcards)
    .filter((c: any) => c?.front && c?.back)
    .map((c: any) => ({
      slide_type: 'flashcard' as const,
      title: String(c.front).slice(0, 200),
      body: String(c.back).slice(0, 1200),
      data: {
        front: String(c.front).slice(0, 200),
        back: String(c.back).slice(0, 1200),
        hint: c.hint ? String(c.hint).slice(0, 200) : undefined,
        source: 'ai_document_pipeline',
      },
      duration_seconds: 25,
    }));

  // Interleave: teach → (flashcard) → teach → … then every quiz question last.
  const slides: DraftSlide[] = [];
  const gap = cards.length > 0 ? Math.max(1, Math.ceil(textSlides.length / (cards.length + 1))) : 0;
  let cardIdx = 0;
  textSlides.forEach((s, i) => {
    slides.push(s);
    if (gap && cardIdx < cards.length && (i + 1) % gap === 0 && i < textSlides.length - 1) {
      slides.push(cards[cardIdx++]);
    }
  });
  while (cardIdx < cards.length) slides.push(cards[cardIdx++]);

  for (const q of quizIn.slice(0, quizCount)) {
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
        // The answer is never revealed while answering: the learner sees the
        // result at the end of the lesson quiz.
        revealAnswers: false,
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
    image_prompt: parsed?.image_prompt ? String(parsed.image_prompt).slice(0, 600) : null,
    source_excerpt: '',
    source_page: null,
    slides,
  };
}

/**
 * One background illustration per lesson, debited like any other image.
 * Returns `stop: true` when generation must not be attempted again
 * (credits exhausted / forbidden) so the rest of the course still completes.
 */
async function generateLessonImage(args: {
  admin: any;
  ctx: { geminiKey: string; openaiKey?: string; orgId: string; projectId: string; userId: string; projectTitle: string; tier: 'standard' | 'premium' };
  lesson: DraftLesson;
  index: number;
  profile: TierProfile;
}): Promise<{ url: string | null; stop: boolean }> {
  const { admin, ctx, lesson, index } = args;

  let debited = 0;
  try {
    const res = await consumeCreditsOrThrow({
      admin, userId: ctx.userId, actionKey: IMAGE_ACTION_KEY, tier: ctx.tier,
      idempotencyKey: `course-draft-image:${ctx.projectId}:${index}`,
      metadata: { project_id: ctx.projectId, lesson_index: index },
    });
    debited = 'skipped' in res ? 0 : res.debited;
  } catch (e: any) {
    console.warn('[course-from-document] image credits unavailable', e?.message);
    return { url: null, stop: e?.status === 402 || e?.status === 403 };
  }

  const scene = lesson.image_prompt
    || `${lesson.title}. ${lesson.summary || lesson.slides[0]?.body?.slice(0, 240) || ''}`;

  const prompt = `Editorial background illustration for an online course slide.
Course: "${ctx.projectTitle}"
Lesson: "${lesson.title}"
Scene: ${scene}
Requirements: wide 16:9 landscape, cinematic depth, rich but calm colours, the subject placed on the left or in the upper third so the lower-centre area stays visually quiet and uncluttered for overlaid text. Soft focus and low visual noise in that quiet area. Professional, modern, photographic or high-end illustration quality. Absolutely NO text, NO words, NO letters, NO logos, NO watermarks, NO UI elements.`;

  try {
    const { base64, mimeType } = await aiGenerateImageBase64({
      geminiKey: ctx.geminiKey, openaiKey: ctx.openaiKey,
      prompt, size: '1536x1024', timeoutMs: 90_000,
    });
    const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
    const path = `${ctx.orgId}/${ctx.projectId}/lessons/lesson-${index}-${Date.now()}.${ext}`;
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const { error: upErr } = await admin.storage.from('org-uploads')
      .upload(path, bytes, { contentType: mimeType, upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from('org-uploads').getPublicUrl(path);
    return { url: pub?.publicUrl || null, stop: false };
  } catch (e) {
    console.warn('[course-from-document] lesson image failed', index, e);
    if (debited > 0) {
      try {
        await refundCreditsAsBonus({
          admin, userId: ctx.userId, amount: debited,
          source: IMAGE_ACTION_KEY, expiresInDays: 30,
        });
      } catch (_) { /* best effort */ }
    }
    return { url: null, stop: false };
  }
}

/** If the model fails on a topic, keep the real source text as slides. */
function fallbackLesson(
  heading: string | null, excerpt: string, index: number, isFr: boolean, profile: TierProfile,
): DraftLesson {
  const paragraphs = excerpt.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf: string[] = [];
  for (const p of paragraphs) {
    buf.push(p);
    if (countWords(buf.join(' ')) > 90) { chunks.push(buf.join('\n\n')); buf = []; }
    if (chunks.length >= profile.maxSlides) break;
  }
  if (buf.length && chunks.length < profile.maxSlides) chunks.push(buf.join('\n\n'));

  const lessonTitle = (heading || `${isFr ? 'Leçon' : 'Lesson'} ${index + 1}`).slice(0, 120);
  const bodies = chunks.length ? chunks : [excerpt.slice(0, 1200)];

  /** A slide must never ship without a heading: derive one from its own text. */
  const headingFor = (body: string, i: number): string => {
    const firstSentence = (body.replace(/\s+/g, ' ').match(/^[^.!?]{12,80}[.!?]?/) || [])[0];
    const derived = firstSentence?.replace(/[.!?]\s*$/, '').trim();
    if (derived && derived.length >= 12) return derived.slice(0, 90);
    return bodies.length > 1 ? `${lessonTitle} (${i + 1}/${bodies.length})` : lessonTitle;
  };

  return {
    title: lessonTitle,
    summary: '',
    image_prompt: null,
    source_excerpt: '',
    source_page: null,
    slides: bodies.map((body, i) => ({
      slide_type: 'text' as const,
      title: headingFor(body, i),
      body: body.slice(0, profile.bodyChars),
      data: { source: 'source_fallback' },
      duration_seconds: 30,
    })),
  };
}

