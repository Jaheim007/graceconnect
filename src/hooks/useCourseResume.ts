import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { flattenProgramSlides, resolveResumePosition, type ResumePosition } from '@/lib/programFlatten';

export interface CourseResume {
  programId: string;
  resume: ResumePosition | null;
  totalCountableSlides: number;
  completedSlideCount: number;
  progressPercent: number;
}

async function loadResume(programIds: string[], userId: string): Promise<Record<string, CourseResume>> {
  const result: Record<string, CourseResume> = {};
  if (!programIds.length) return result;

  const [{ data: modules }, { data: enrollments }] = await Promise.all([
    db
      .from('program_modules')
      .select('id, title, program_id, order_index, program_lessons(id, title, content, display_order, order_index)')
      .in('program_id', programIds)
      .order('order_index', { ascending: true }),
    db
      .from('program_enrollments')
      .select('program_id, current_slide_id, current_lesson_id, last_slide_index, completed_slides, progress_percent')
      .eq('user_id', userId)
      .in('program_id', programIds),
  ]);

  const modsByProgram: Record<string, any[]> = {};
  const lessonIds: string[] = [];
  for (const mod of modules || []) {
    const lessons = ((mod as any).program_lessons || []).sort(
      (a: any, b: any) => (a.display_order ?? a.order_index ?? 0) - (b.display_order ?? b.order_index ?? 0),
    );
    (modsByProgram[(mod as any).program_id] ||= []).push({ ...(mod as any), lessons });
    lessons.forEach((l: any) => lessonIds.push(l.id));
  }

  const slideMap: Record<string, any[]> = {};
  const quizModuleIds: string[] = [];
  if (lessonIds.length) {
    const [{ data: slides }, { data: quizzes }] = await Promise.all([
      (db as any).from('program_slides').select('id, lesson_id, display_order').in('lesson_id', lessonIds),
      db.from('program_quizzes').select('id, module_id, quiz_questions(id)').in('lesson_id', lessonIds).limit(1).then(
        async () => await db.from('program_quizzes').select('id, module_id, quiz_questions(id)').not('module_id', 'is', null),
      ),
    ]);
    for (const row of (slides || []).sort((a: any, b: any) => a.display_order - b.display_order)) {
      (slideMap[(row as any).lesson_id] ||= []).push(row);
    }
    for (const q of (quizzes as any[]) || []) {
      if ((q.quiz_questions || []).length > 0 && q.module_id) quizModuleIds.push(q.module_id);
    }
  }

  for (const programId of programIds) {
    const mods = modsByProgram[programId] || [];
    const enrollment = (enrollments || []).find((e: any) => e.program_id === programId);
    const flat = flattenProgramSlides({
      modules: mods,
      slideMap,
      quizModuleIds: quizModuleIds.filter((id) => mods.some((m) => m.id === id)),
    });
    const countable = flat.filter((s) => s.countsForProgress);
    const completedSlides = new Set<string>(((enrollment as any)?.completed_slides || []) as string[]);
    const lastIndex = (enrollment as any)?.last_slide_index ?? -1;
    const legacyReached = countable.filter((s, i) => !s.slideId && i <= lastIndex).length;
    const completedSlideCount = completedSlides.size + legacyReached;

    result[programId] = {
      programId,
      resume: resolveResumePosition(flat, enrollment as any),
      totalCountableSlides: countable.length,
      completedSlideCount,
      progressPercent:
        (enrollment as any)?.progress_percent ??
        (countable.length ? Math.min(100, Math.round((completedSlideCount / countable.length) * 100)) : 0),
    };
  }

  return result;
}

/** Resume + slide-level progress info for a set of enrolled courses */
export function useCourseResume(programIds: string[]) {
  const { user } = useAuth();
  const ids = [...programIds].sort();
  return useQuery({
    queryKey: ['course-resume', user?.id, ids.join(',')],
    enabled: !!user?.id && ids.length > 0,
    queryFn: () => loadResume(ids, user!.id),
  });
}

/** Resume info for a single course */
export function useProgramResume(programId: string | undefined) {
  const { data } = useCourseResume(programId ? [programId] : []);
  return programId ? data?.[programId] : undefined;
}
