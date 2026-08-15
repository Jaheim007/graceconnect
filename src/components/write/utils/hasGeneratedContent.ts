import type { WriteChapter } from '../WriteWizard';

function getPlainText(content: unknown) {
  if (typeof content !== 'string') return '';

  return content
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasGeneratedContent(chapters: WriteChapter[] | null | undefined) {
  if (!Array.isArray(chapters) || chapters.length === 0) return false;

  return chapters.some((chapter) => {
    const title = (chapter?.title || '').trim();
    const content = getPlainText(chapter?.content);
    return title.length > 0 || content.length > 0;
  });
}

/** Minimum characters for a chapter body to count as actually written (not a one-line summary). */
const MIN_CHAPTER_BODY_CHARS = 400;

/** True only when EVERY chapter has a real, written body. */
export function isFullyWritten(chapters: WriteChapter[] | null | undefined) {
  if (!Array.isArray(chapters) || chapters.length === 0) return false;

  return chapters.every((chapter) => getPlainText(chapter?.content).length >= MIN_CHAPTER_BODY_CHARS);
}
