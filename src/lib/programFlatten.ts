/**
 * Shared flattening of a course into the exact slide sequence the player uses.
 *
 * Two slide sources are supported and must stay interchangeable:
 *  - slide-backed lessons: real `program_slides` rows (each has a uuid)
 *  - legacy HTML lessons: one HTML blob parsed at runtime (no uuid available)
 *
 * Every flat entry therefore carries `slideId: string | null` — null means the
 * slide is legacy and cannot be stored in `program_enrollments.completed_slides`
 * (uuid[]); progress for those slides is tracked positionally instead.
 */
import { parseContentIntoSlides } from '@/components/programs/lesson-preview/parseContentSlides';

export interface FlatSlideRef {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
  lessonIndex: number;
  slideInLesson: number;
  slideId: string | null;
  /** false for the synthetic completion slide */
  countsForProgress: boolean;
  isSynthetic: boolean;
}

interface FlattenArgs {
  modules: any[];
  slideMap: Record<string, any[]>;
  /** module ids that have a playable quiz slide */
  quizModuleIds?: string[];
  /** whether the final assessment slide is present */
  hasFinalAssessment?: boolean;
}

/** Strip the lesson hero-image block the player removes before parsing */
function cleanLessonHtml(html: string | null): string {
  if (!html) return '';
  return html.replace(/<div[^>]*class=["'][^"']*lesson-hero-image[^"']*["'][^>]*>[\s\S]*?<\/div>/i, '').trim();
}

/** Number of content slides in a lesson, from slide rows or legacy HTML */
export function countLessonContentSlides(lesson: any, slideMap: Record<string, any[]>): number {
  const rows = slideMap[lesson?.id];
  if (rows && rows.length > 0) return rows.length;
  return parseContentIntoSlides(cleanLessonHtml(lesson?.content || '')).length;
}

export function flattenProgramSlides({
  modules,
  slideMap,
  quizModuleIds = [],
  hasFinalAssessment = false,
}: FlattenArgs): FlatSlideRef[] {
  const out: FlatSlideRef[] = [];
  let lessonIdx = 0;

  for (const mod of modules || []) {
    const lessons = (mod as any).lessons || (mod as any).program_lessons || [];
    for (const lesson of lessons) {
      const rows = slideMap[lesson.id] || [];
      const base = {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleId: mod.id,
        moduleTitle: mod.title,
        lessonIndex: lessonIdx,
      };

      // Lesson title card (synthetic, but part of the sequence)
      out.push({ ...base, slideInLesson: 0, slideId: null, countsForProgress: true, isSynthetic: true });

      if (rows.length > 0) {
        rows.forEach((row: any, si: number) => {
          out.push({ ...base, slideInLesson: si + 1, slideId: row.id, countsForProgress: true, isSynthetic: false });
        });
      } else {
        const parsed = parseContentIntoSlides(cleanLessonHtml(lesson.content || ''));
        parsed.forEach((_, si) => {
          out.push({ ...base, slideInLesson: si + 1, slideId: null, countsForProgress: true, isSynthetic: false });
        });
      }

      lessonIdx++;
    }

    if (quizModuleIds.includes(mod.id)) {
      out.push({
        lessonId: `__module_quiz_${mod.id}__`,
        lessonTitle: mod.title,
        moduleId: mod.id,
        moduleTitle: mod.title,
        lessonIndex: lessonIdx,
        slideInLesson: 0,
        slideId: null,
        countsForProgress: true,
        isSynthetic: true,
      });
    }
  }

  if (hasFinalAssessment) {
    out.push({
      lessonId: '__final_assessment__',
      lessonTitle: 'Final assessment',
      moduleId: '__assessment__',
      moduleTitle: '__assessment__',
      lessonIndex: lessonIdx,
      slideInLesson: 0,
      slideId: null,
      countsForProgress: true,
      isSynthetic: true,
    });
  }

  out.push({
    lessonId: '__completion__',
    lessonTitle: 'Completed',
    moduleId: '__completion__',
    moduleTitle: '__completion__',
    lessonIndex: lessonIdx + 1,
    slideInLesson: 0,
    slideId: null,
    countsForProgress: false,
    isSynthetic: true,
  });

  return out;
}

export interface ResumePosition {
  /** flat index in the player sequence */
  flatIndex: number;
  lessonId: string | null;
  lessonNumber: number;
  lessonTitle: string;
  slideNumber: number;
  slidesInLesson: number;
  slideId: string | null;
  /** how the position was recovered */
  source: 'slide_id' | 'lesson_index' | 'lesson_start' | 'flat_index' | 'start';
}

/**
 * Resolve the learner's resume position.
 *
 * Priority:
 *  1. `current_slide_id` — exact slide (only possible for slide-backed lessons)
 *  2. `current_lesson_id` + `last_slide_index` — legacy HTML lessons: the flat
 *     index is trusted when it still falls inside that lesson, otherwise we open
 *     at the first slide of that lesson
 *  3. `last_slide_index` alone
 *  4. start of the course
 */
export function resolveResumePosition(
  flat: FlatSlideRef[],
  enrollment: { current_slide_id?: string | null; current_lesson_id?: string | null; last_slide_index?: number | null } | null | undefined,
): ResumePosition | null {
  if (!flat.length) return null;

  const describe = (index: number, source: ResumePosition['source']): ResumePosition => {
    const entry = flat[index];
    const lessonSlides = flat.filter((s) => s.lessonId === entry.lessonId);
    return {
      flatIndex: index,
      lessonId: entry.isSynthetic && entry.slideInLesson === 0 && entry.lessonId.startsWith('__') ? null : entry.lessonId,
      lessonNumber: entry.lessonIndex + 1,
      lessonTitle: entry.lessonTitle,
      slideNumber: entry.slideInLesson + 1,
      slidesInLesson: lessonSlides.length,
      slideId: entry.slideId,
      source,
    };
  };

  const slideId = enrollment?.current_slide_id;
  if (slideId) {
    const idx = flat.findIndex((s) => s.slideId === slideId);
    if (idx >= 0) return describe(idx, 'slide_id');
  }

  const lessonId = enrollment?.current_lesson_id;
  const lastIndex = enrollment?.last_slide_index ?? -1;

  if (lessonId) {
    if (lastIndex >= 0 && lastIndex < flat.length && flat[lastIndex].lessonId === lessonId) {
      return describe(lastIndex, 'lesson_index');
    }
    const idx = flat.findIndex((s) => s.lessonId === lessonId);
    if (idx >= 0) return describe(idx, 'lesson_start');
  }

  if (lastIndex > 0 && lastIndex < flat.length) return describe(lastIndex, 'flat_index');

  return describe(0, 'start');
}
