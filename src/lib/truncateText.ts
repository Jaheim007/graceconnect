/**
 * Truncate text at a word boundary and add an ellipsis, so shared
 * descriptions never get cut in the middle of a word.
 */
export function truncateWords(input: string | null | undefined, max = 155): string {
  const text = (input || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;

  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:.!?—–-]+$/, '')}…`;
}

/**
 * Truncate on sentence boundaries so shared captions read like real copy
 * (never cut mid-word or mid-sentence).
 */
export function truncateSentences(input: string | null | undefined, max = 220): string {
  const text = (input || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;

  const slice = text.slice(0, max + 1);
  const lastStop = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('… '),
  );
  if (lastStop > max * 0.4) return slice.slice(0, lastStop + 1).trim();
  return truncateWords(text, max);
}
