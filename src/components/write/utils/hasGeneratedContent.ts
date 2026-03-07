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
