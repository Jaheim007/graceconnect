// Server-only full-course duplication (+ optional AI translation).
// Ported from the `duplicate-course` edge function.
import { aiGenerateText, extractJson } from '@/lib/ai/providers.server';
import { consumeCreditsWithRefund, type CreditTier } from '@/lib/credits/credits.server';

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
      out[k] = typeof v === 'string' && v.trim() ? v : chunk[k]!;
    }
  }
  return out;
}

export interface DuplicateCourseResult {
  ok: true;
  program_id: string;
  translated: boolean;
  target_language: string | null;
  lessons: number;
}

export async function duplicateCourse(
  userId: string,
  input: {
    program_id: string;
    org_id: string;
    translate: boolean;
    target_language: string | null;
    tier: CreditTier;
  },
): Promise<DuplicateCourseResult> {
  const { program_id: programId, org_id: orgId, translate, target_language: targetLanguage } = input;

  if (translate && !targetLanguage) throw new Error('target_language required when translate is true');
  if (translate && !LANG_NAMES[targetLanguage!]) throw new Error('Unsupported language');

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const admin = supabaseAdmin as any;

  const { data: member } = await admin
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
    throw new Error('Forbidden');
  }

  const { data: original } = await admin
    .from('programs')
    .select('*')
    .eq('id', programId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!original) throw new Error('Course not found');

  const { data: modules } = await admin
    .from('program_modules')
    .select('*')
    .eq('program_id', programId)
    .order('order_index', { ascending: true });
  const moduleIds = (modules || []).map((m: any) => m.id);

  const { data: lessons } = moduleIds.length
    ? await admin.from('program_lessons').select('*').in('module_id', moduleIds)
    : { data: [] as any[] };
  const lessonIds = (lessons || []).map((l: any) => l.id);

  const { data: slides } = lessonIds.length
    ? await admin
        .from('program_slides')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('display_order', { ascending: true })
    : { data: [] as any[] };

  const { data: quizzes } = await admin
    .from('program_quizzes')
    .select('*')
    .or(
      [
        lessonIds.length ? `lesson_id.in.(${lessonIds.join(',')})` : '',
        moduleIds.length ? `module_id.in.(${moduleIds.join(',')})` : '',
      ]
        .filter(Boolean)
        .join(',') || 'id.is.null',
    );
  const quizIds = (quizzes || []).map((q: any) => q.id);

  const { data: questions } = quizIds.length
    ? await admin
        .from('quiz_questions')
        .select('*')
        .in('quiz_id', quizIds)
        .order('display_order', { ascending: true })
    : { data: [] as any[] };

  const { data: flashcards } = moduleIds.length
    ? await admin
        .from('module_flashcards')
        .select('*')
        .in('module_id', moduleIds)
        .order('display_order', { ascending: true })
    : { data: [] as any[] };

  const langName = targetLanguage ? LANG_NAMES[targetLanguage] || targetLanguage : '';
  let translated: StringMap = {};

  const collect = (): StringMap => {
    const map: StringMap = {};
    map['program.title'] = original.title || '';
    if (original.description) map['program.description'] = original.description;
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
    const geminiKey = process.env['GEMINI_API_KEY'];
    if (!geminiKey) throw new Error('AI not configured');
    const source = collect();
    translated = await consumeCreditsWithRefund<StringMap>({
      admin,
      userId,
      actionKey: 'translate_course',
      tier: input.tier,
      action: () => translateMap(source, langName, geminiKey),
    });
  }

  const t = (key: string, fallback: string | null) =>
    translate && translated[key] ? translated[key]! : fallback;

  const suffix = translate ? ` (${(targetLanguage || '').toUpperCase()})` : ' (Copy)';

  const { data: newProgram, error: pErr } = await admin
    .from('programs')
    .insert({
      organization_id: orgId,
      created_by: userId,
      title: `${t('program.title', original.title) || original.title}${suffix}`,
      description: t('program.description', original.description),
      cover_image_url: original.cover_image_url,
      price: original.price,
      currency: original.currency,
      is_free: original.is_free,
      is_published: false,
      publication_status: 'draft',
      certificate_enabled: original.certificate_enabled,
      certificate_design: original.certificate_design,
      passing_score: original.passing_score,
      max_quiz_attempts: original.max_quiz_attempts,
      require_sequential_lessons: original.require_sequential_lessons,
      require_assessment_for_cert: original.require_assessment_for_cert,
      assessment_enabled: original.assessment_enabled,
      gamification_enabled: original.gamification_enabled,
      themes: original.themes,
      ai_generated: original.ai_generated,
      content_language: targetLanguage || original.content_language,
    })
    .select('id')
    .single();
  if (pErr) throw pErr;
  const newProgramId = newProgram.id as string;

  const moduleMap: Record<string, string> = {};
  const lessonMap: Record<string, string> = {};

  for (const m of modules || []) {
    const { data: newMod } = await admin
      .from('program_modules')
      .insert({
        program_id: newProgramId,
        title: t(`module.${m.id}.title`, m.title),
        description: t(`module.${m.id}.description`, m.description),
        order_index: m.order_index,
      })
      .select('id')
      .single();
    if (!newMod) continue;
    moduleMap[m.id] = newMod.id;
  }

  const sortedLessons = (lessons || [])
    .slice()
    .sort(
      (a: any, b: any) =>
        (a.order_index ?? a.display_order ?? 0) - (b.order_index ?? b.display_order ?? 0),
    );
  for (const l of sortedLessons) {
    const newModuleId = moduleMap[l.module_id];
    if (!newModuleId) continue;
    const { data: newLesson } = await admin
      .from('program_lessons')
      .insert({
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
      })
      .select('id')
      .single();
    if (!newLesson) continue;
    lessonMap[l.id] = newLesson.id;
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
          typeof opt === 'string' ? t(`slide.${s.id}.data.options.${i}`, opt) : opt,
        );
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
    });
  }

  for (const q of quizzes || []) {
    const newLessonId = q.lesson_id ? lessonMap[q.lesson_id] : null;
    const newModuleId = q.module_id ? moduleMap[q.module_id] : null;
    if (!newLessonId && !newModuleId) continue;
    const { data: newQuiz } = await admin
      .from('program_quizzes')
      .insert({
        lesson_id: newLessonId,
        module_id: newModuleId,
        title: t(`quiz.${q.id}.title`, q.title),
        passing_score: q.passing_score,
        max_attempts: q.max_attempts,
        quiz_type: q.quiz_type,
      })
      .select('id')
      .single();
    if (!newQuiz) continue;

    const qQuestions = (questions || []).filter((x: any) => x.quiz_id === q.id);
    for (const qq of qQuestions) {
      let options = qq.options;
      if (translate && Array.isArray(options)) {
        options = options.map((opt: any, i: number) =>
          typeof opt === 'string' ? t(`question.${qq.id}.options.${i}`, opt) : opt,
        );
      }
      await admin.from('quiz_questions').insert({
        quiz_id: newQuiz.id,
        question: t(`question.${qq.id}.question`, qq.question),
        options,
        correct_index: qq.correct_index,
        correct_text: t(`question.${qq.id}.correct_text`, qq.correct_text),
        explanation: t(`question.${qq.id}.explanation`, qq.explanation),
        question_type: qq.question_type,
        display_order: qq.display_order,
      });
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
    });
  }

  await admin.from('audit_logs').insert({
    user_id: userId,
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

  return {
    ok: true,
    program_id: newProgramId,
    translated: translate,
    target_language: targetLanguage,
    lessons: Object.keys(lessonMap).length,
  };
}
