import { requireAuth, corsHeaders, jsonResp, adminClient } from '../_shared/auth.ts';
import { consumeCreditsWithRefund, normalizeTier } from '../_shared/credits.ts';
import { aiGenerateText, extractJson } from '../_shared/ai-fallback.ts';

const LANG_NAMES: Record<string, string> = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  de: 'German',
  it: 'Italian',
  ar: 'Arabic',
  sw: 'Swahili',
};

type StringMap = Record<string, string>;

/** Translate a flat {key: text} map in batches. Returns the same keys. */
async function translateMap(
  map: StringMap,
  targetLang: string,
  geminiKey: string,
): Promise<StringMap> {
  const entries = Object.entries(map).filter(([, v]) => typeof v === 'string' && v.trim());
  const out: StringMap = {};
  const BATCH = 30;

  for (let i = 0; i < entries.length; i += BATCH) {
    const chunk = Object.fromEntries(entries.slice(i, i + BATCH));
    const raw = await aiGenerateText({
      geminiKey,
      model: 'gemini-2.5-flash',
      system: `You are a professional course localizer. Translate every VALUE of the given JSON object into ${targetLang}.
Rules:
- Return ONLY a JSON object with EXACTLY the same keys.
- Never translate or alter the keys.
- Preserve any HTML tags, markdown, line breaks and placeholders exactly.
- Keep proper nouns, brand names, code snippets and URLs untouched.
- Write natural, native-sounding ${targetLang} — not a literal translation.`,
      prompt: JSON.stringify(chunk),
      jsonMode: true,
    });
    const parsed = extractJson(raw);
    for (const k of Object.keys(chunk)) {
      const v = parsed?.[k];
      out[k] = typeof v === 'string' && v.trim() ? v : chunk[k];
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const programId = body?.program_id as string | undefined;
    const orgId = body?.org_id as string | undefined;
    const translate = body?.translate === true;
    const targetLanguage = typeof body?.target_language === 'string' ? body.target_language : null;
    const tier = normalizeTier(body?.tier);

    if (!programId || !orgId) return jsonResp({ error: 'program_id and org_id required' }, 400);
    if (translate && !targetLanguage) return jsonResp({ error: 'target_language required when translate is true' }, 400);
    if (translate && !LANG_NAMES[targetLanguage!]) return jsonResp({ error: 'Unsupported language' }, 400);

    const admin = adminClient(auth.supabaseUrl, auth.serviceKey);

    // Permission check
    const { data: member } = await admin.from('organization_members')
      .select('role').eq('user_id', auth.userId).eq('organization_id', orgId).maybeSingle();
    if (!member || !['owner', 'admin', 'editor'].includes((member as any).role)) {
      return jsonResp({ error: 'Forbidden' }, 403);
    }

    // ─── Load the whole course tree ───
    const { data: original } = await admin.from('programs')
      .select('*').eq('id', programId).eq('organization_id', orgId).maybeSingle();
    if (!original) return jsonResp({ error: 'Course not found' }, 404);

    const { data: modules } = await admin.from('program_modules')
      .select('*').eq('program_id', programId).order('order_index', { ascending: true });
    const moduleIds = (modules || []).map((m: any) => m.id);

    const { data: lessons } = moduleIds.length
      ? await admin.from('program_lessons').select('*').in('module_id', moduleIds)
      : { data: [] as any[] };
    const lessonIds = (lessons || []).map((l: any) => l.id);

    const { data: slides } = lessonIds.length
      ? await admin.from('program_slides').select('*').in('lesson_id', lessonIds).order('display_order', { ascending: true })
      : { data: [] as any[] };

    const { data: quizzes } = await admin.from('program_quizzes')
      .select('*')
      .or([
        lessonIds.length ? `lesson_id.in.(${lessonIds.join(',')})` : '',
        moduleIds.length ? `module_id.in.(${moduleIds.join(',')})` : '',
      ].filter(Boolean).join(',') || 'id.is.null');
    const quizIds = (quizzes || []).map((q: any) => q.id);

    const { data: questions } = quizIds.length
      ? await admin.from('quiz_questions').select('*').in('quiz_id', quizIds).order('display_order', { ascending: true })
      : { data: [] as any[] };

    const { data: flashcards } = moduleIds.length
      ? await admin.from('module_flashcards').select('*').in('module_id', moduleIds).order('display_order', { ascending: true })
      : { data: [] as any[] };

    // ─── Build translation map (only when requested) ───
    const langName = targetLanguage ? (LANG_NAMES[targetLanguage] || targetLanguage) : '';
    let translated: StringMap = {};

    const collect = () => {
      const map: StringMap = {};
      map['program.title'] = (original as any).title || '';
      if ((original as any).description) map['program.description'] = (original as any).description;
      for (const m of modules || []) {
        map[`module.${m.id}.title`] = m.title || '';
        if (m.description) map[`module.${m.id}.description`] = m.description;
      }
      for (const l of lessons || []) {
        map[`lesson.${l.id}.title`] = l.title || '';
        if (l.content) map[`lesson.${l.id}.content`] = l.content;
      }
      for (const s of slides || []) {
        if (s.title) map[`slide.${s.id}.title`] = s.title;
        if (s.body) map[`slide.${s.id}.body`] = s.body;
        if (s.caption) map[`slide.${s.id}.caption`] = s.caption;
        const d = s.data || {};
        if (typeof d.question === 'string') map[`slide.${s.id}.data.question`] = d.question;
        if (typeof d.explanation === 'string') map[`slide.${s.id}.data.explanation`] = d.explanation;
        if (typeof d.front === 'string') map[`slide.${s.id}.data.front`] = d.front;
        if (typeof d.back === 'string') map[`slide.${s.id}.data.back`] = d.back;
        if (Array.isArray(d.options)) {
          d.options.forEach((opt: any, i: number) => {
            if (typeof opt === 'string' && opt.trim()) map[`slide.${s.id}.data.options.${i}`] = opt;
          });
        }
      }
      for (const q of quizzes || []) {
        if (q.title) map[`quiz.${q.id}.title`] = q.title;
      }
      for (const q of questions || []) {
        map[`question.${q.id}.question`] = q.question || '';
        if (q.explanation) map[`question.${q.id}.explanation`] = q.explanation;
        if (q.correct_text) map[`question.${q.id}.correct_text`] = q.correct_text;
        if (Array.isArray(q.options)) {
          q.options.forEach((opt: any, i: number) => {
            if (typeof opt === 'string' && opt.trim()) map[`question.${q.id}.options.${i}`] = opt;
          });
        }
      }
      for (const f of flashcards || []) {
        if (f.front_text) map[`flashcard.${f.id}.front`] = f.front_text;
        if (f.back_text) map[`flashcard.${f.id}.back`] = f.back_text;
      }
      return map;
    };

    if (translate) {
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
      if (!GEMINI_API_KEY) return jsonResp({ error: 'AI not configured' }, 500);
      const source = collect();

      const result = await consumeCreditsWithRefund({
        admin,
        userId: auth.userId,
        actionKey: 'translate_course',
        tier,
        action: async () => await translateMap(source, langName, GEMINI_API_KEY),
      });
      translated = result as StringMap;
    }

    const t = (key: string, fallback: string | null) =>
      (translate && translated[key]) ? translated[key] : fallback;

    // ─── Insert the duplicate (always a draft) ───
    const suffix = translate
      ? ` (${(targetLanguage || '').toUpperCase()})`
      : ' (Copy)';

    const { data: newProgram, error: pErr } = await admin.from('programs').insert({
      organization_id: orgId,
      created_by: auth.userId,
      title: `${t('program.title', (original as any).title) || (original as any).title}${suffix}`,
      description: t('program.description', (original as any).description),
      cover_image_url: (original as any).cover_image_url,
      price: (original as any).price,
      currency: (original as any).currency,
      is_free: (original as any).is_free,
      is_published: false,
      publication_status: 'draft',
      certificate_enabled: (original as any).certificate_enabled,
      certificate_design: (original as any).certificate_design,
      passing_score: (original as any).passing_score,
      max_quiz_attempts: (original as any).max_quiz_attempts,
      require_sequential_lessons: (original as any).require_sequential_lessons,
      require_assessment_for_cert: (original as any).require_assessment_for_cert,
      assessment_enabled: (original as any).assessment_enabled,
      gamification_enabled: (original as any).gamification_enabled,
      themes: (original as any).themes,
      ai_generated: (original as any).ai_generated,
      content_language: targetLanguage || (original as any).content_language,
    } as any).select('id').single();
    if (pErr) throw pErr;
    const newProgramId = (newProgram as any).id as string;

    const moduleMap: Record<string, string> = {};
    const lessonMap: Record<string, string> = {};

    for (const m of modules || []) {
      const { data: newMod } = await admin.from('program_modules').insert({
        program_id: newProgramId,
        title: t(`module.${m.id}.title`, m.title),
        description: t(`module.${m.id}.description`, m.description),
        order_index: m.order_index,
      } as any).select('id').single();
      if (!newMod) continue;
      moduleMap[m.id] = (newMod as any).id;
    }

    const sortedLessons = (lessons || []).slice().sort(
      (a: any, b: any) => (a.order_index ?? a.display_order ?? 0) - (b.order_index ?? b.display_order ?? 0),
    );
    for (const l of sortedLessons) {
      const newModuleId = moduleMap[l.module_id];
      if (!newModuleId) continue;
      const { data: newLesson } = await admin.from('program_lessons').insert({
        module_id: newModuleId,
        title: t(`lesson.${l.id}.title`, l.title),
        content: t(`lesson.${l.id}.content`, l.content),
        content_type: l.content_type,
        content_url: l.content_url,
        video_url: l.video_url,
        duration_minutes: l.duration_minutes,
        order_index: l.order_index,
        display_order: l.display_order,
        is_free_preview: l.is_free_preview,
      } as any).select('id').single();
      if (!newLesson) continue;
      lessonMap[l.id] = (newLesson as any).id;
    }

    for (const s of slides || []) {
      const newLessonId = lessonMap[s.lesson_id];
      if (!newLessonId) continue;
      const data = s.data ? { ...s.data } : null;
      if (data && translate) {
        for (const field of ['question', 'explanation', 'front', 'back'] as const) {
          if (typeof data[field] === 'string') {
            data[field] = t(`slide.${s.id}.data.${field}`, data[field]);
          }
        }
        if (Array.isArray(data.options)) {
          data.options = data.options.map((opt: any, i: number) =>
            typeof opt === 'string' ? t(`slide.${s.id}.data.options.${i}`, opt) : opt);
        }
      }
      await admin.from('program_slides').insert({
        lesson_id: newLessonId,
        display_order: s.display_order,
        slide_type: s.slide_type,
        title: t(`slide.${s.id}.title`, s.title),
        body: t(`slide.${s.id}.body`, s.body),
        media_url: s.media_url,
        caption: t(`slide.${s.id}.caption`, s.caption),
        data,
        duration_seconds: s.duration_seconds,
      } as any);
    }

    for (const q of quizzes || []) {
      const newLessonId = q.lesson_id ? lessonMap[q.lesson_id] : null;
      const newModuleId = q.module_id ? moduleMap[q.module_id] : null;
      if (!newLessonId && !newModuleId) continue;
      const { data: newQuiz } = await admin.from('program_quizzes').insert({
        lesson_id: newLessonId,
        module_id: newModuleId,
        title: t(`quiz.${q.id}.title`, q.title),
        passing_score: q.passing_score,
        max_attempts: q.max_attempts,
        quiz_type: q.quiz_type,
      } as any).select('id').single();
      if (!newQuiz) continue;

      const qQuestions = (questions || []).filter((x: any) => x.quiz_id === q.id);
      for (const qq of qQuestions) {
        let options = qq.options;
        if (translate && Array.isArray(options)) {
          options = options.map((opt: any, i: number) =>
            typeof opt === 'string' ? t(`question.${qq.id}.options.${i}`, opt) : opt);
        }
        await admin.from('quiz_questions').insert({
          quiz_id: (newQuiz as any).id,
          question: t(`question.${qq.id}.question`, qq.question),
          options,
          correct_index: qq.correct_index,
          correct_text: t(`question.${qq.id}.correct_text`, qq.correct_text),
          explanation: t(`question.${qq.id}.explanation`, qq.explanation),
          question_type: qq.question_type,
          display_order: qq.display_order,
        } as any);
      }
    }

    for (const f of flashcards || []) {
      const newModuleId = moduleMap[f.module_id];
      if (!newModuleId) continue;
      await admin.from('module_flashcards').insert({
        module_id: newModuleId,
        front_text: t(`flashcard.${f.id}.front`, f.front_text),
        back_text: t(`flashcard.${f.id}.back`, f.back_text),
        display_order: f.display_order,
      } as any);
    }

    await admin.from('audit_logs').insert({
      user_id: auth.userId,
      action: translate ? 'program.duplicated_translated' : 'program.duplicated',
      resource_type: 'program',
      resource_id: newProgramId,
      organization_id: orgId,
      metadata: {
        source_program_id: programId,
        target_language: targetLanguage,
        translated: translate,
        modules: Object.keys(moduleMap).length,
        lessons: Object.keys(lessonMap).length,
      },
    });

    return jsonResp({
      ok: true,
      program_id: newProgramId,
      translated: translate,
      target_language: targetLanguage,
      lessons: Object.keys(lessonMap).length,
    });
  } catch (e: any) {
    if (e?.status === 402) return jsonResp({ error: e.message }, 402);
    console.error('duplicate-course error:', e);
    return jsonResp({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});
