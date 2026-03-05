/**
 * Estimate reading time for a text or HTML string.
 *
 * Usage:
 *   const { minutes, words } = estimateReadingTime(article.body);
 *   // → { minutes: 3, words: 640 }
 */

const WORDS_PER_MINUTE = 200; // Average for French text

function stripHtml(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

export function estimateReadingTime(content: string): { minutes: number; words: number; label: string } {
  const text = content.includes('<') ? stripHtml(content) : content;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return {
    minutes,
    words,
    label: `${minutes} min de lecture`,
  };
}
