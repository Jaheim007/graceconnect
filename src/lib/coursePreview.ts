/**
 * Guest preview rules for course playback (Phase 5).
 *
 * A slide is previewable when either:
 *  - its lesson is flagged `is_free_preview`, or
 *  - it is one of the first N slides of the FIRST lesson of the course.
 *
 * Quiz slides, the final assessment and the completion slide are never
 * previewable — they belong to the paid experience.
 *
 * Guest playback records NO progress: no anonymous session row, no local
 * progress merge. The only thing carried across sign-in is the slide the
 * guest was trying to reach (see `buildCourseSlideLink`).
 */

/** Content slides of lesson 1 offered for free (slide 0 is the lesson title card). */
export const PREVIEW_SLIDES_IN_FIRST_LESSON = 3;

export interface PreviewableEntry {
  lessonId: string;
  lessonIndex: number;
  slideInLesson: number;
}

/** Lesson ids explicitly marked as free preview by the creator. */
export function buildPreviewLessonIds(modules: any[]): Set<string> {
  const ids = new Set<string>();
  for (const mod of modules || []) {
    const lessons = (mod as any).lessons || (mod as any).program_lessons || [];
    for (const lesson of lessons) {
      if (lesson?.is_free_preview) ids.add(lesson.id);
    }
  }
  return ids;
}

export function isSlidePreviewable(entry: PreviewableEntry, previewLessonIds: Set<string>): boolean {
  if (!entry) return false;
  // Synthetic sequence entries (module quiz, final assessment, completion)
  if (entry.lessonId.startsWith('__')) return false;
  if (previewLessonIds.has(entry.lessonId)) return true;
  return entry.lessonIndex === 0 && entry.slideInLesson <= PREVIEW_SLIDES_IN_FIRST_LESSON;
}

/** Canonical share URL for a course. */
export function buildCourseShareUrl(programId: string, origin = 'https://siteviral.com'): string {
  return `${origin}/program/${programId}`;
}

/**
 * Root-relative deep link back to an exact slide — used as the post-sign-in
 * returnTo so a guest lands on the slide they were blocked on.
 */
export function buildCourseSlideLink(
  programId: string,
  opts: { slideId?: string | null; slideIndex?: number | null } = {},
): string {
  const params = new URLSearchParams();
  if (opts.slideId) params.set('slideId', opts.slideId);
  if (typeof opts.slideIndex === 'number' && opts.slideIndex >= 0) params.set('slide', String(opts.slideIndex));
  params.set('play', '1');
  return `/program/${programId}?${params.toString()}`;
}
