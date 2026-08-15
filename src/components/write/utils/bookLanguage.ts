export const SUPPORTED_BOOK_LANGUAGES = ['fr', 'en', 'es', 'pt', 'de', 'sw'] as const;

export type SupportedBookLanguage = typeof SUPPORTED_BOOK_LANGUAGES[number];

export function isSupportedBookLanguage(value?: string | null): value is SupportedBookLanguage {
  return !!value && SUPPORTED_BOOK_LANGUAGES.includes(value as SupportedBookLanguage);
}

export function resolveBookLanguageFromLocale(locale?: string | null): SupportedBookLanguage | null {
  const shortLocale = locale?.slice(0, 2).toLowerCase();
  return isSupportedBookLanguage(shortLocale) ? shortLocale : null;
}

/**
 * Lightweight language detection from what the author actually typed (book
 * topic / title). The UI language must never decide the book language: a French
 * interface with an English idea has to produce an English book.
 */
const LANGUAGE_MARKERS: Record<SupportedBookLanguage, RegExp[]> = {
  fr: [/\b(le|la|les|un|une|des|du|de|et|pour|dans|avec|sur|comment|pourquoi|mon|ma|mes|ton|votre|nos|ce|cette|qui|que|plus|sans|chez|être|avoir|guide|livre|vie|argent|dieu|église|femme|homme|enfant|jour)\b/gi, /[àâçéèêëîïôùûœ]/gi],
  en: [/\b(the|a|an|and|for|of|to|in|with|on|how|why|your|my|our|this|that|who|what|from|without|about|book|guide|life|money|god|church|woman|man|child|day|business|habits|mindset)\b/gi],
  es: [/\b(el|la|los|las|un|una|y|para|de|en|con|sobre|cómo|por qué|mi|tu|su|este|esta|que|quien|sin|vida|dinero|dios|iglesia|mujer|hombre|niño|día|libro|guía)\b/gi, /[¿¡ñáíóúü]/gi],
  pt: [/\b(o|a|os|as|um|uma|e|para|de|em|com|sobre|como|por que|meu|minha|seu|sua|este|esta|que|quem|sem|vida|dinheiro|deus|igreja|mulher|homem|criança|dia|livro|guia)\b/gi, /[ãõçáíóúê]/gi],
  de: [/\b(der|die|das|ein|eine|und|für|von|in|mit|auf|wie|warum|mein|dein|ihr|dieser|diese|wer|was|ohne|über|leben|geld|gott|kirche|frau|mann|kind|tag|buch|führer)\b/gi, /[äöüß]/gi],
  sw: [/\b(na|ya|wa|kwa|katika|kama|nini|kwanini|yangu|yako|hii|hiyo|maisha|pesa|mungu|kanisa|mwanamke|mwanamume|mtoto|siku|kitabu|mwongozo)\b/gi],
};

export function detectLanguageFromText(text?: string | null): SupportedBookLanguage | null {
  const clean = (text || '').trim();
  // Too short to be reliable (e.g. a two-word title in a shared vocabulary).
  if (clean.length < 8) return null;

  let best: SupportedBookLanguage | null = null;
  let bestScore = 0;

  for (const lang of SUPPORTED_BOOK_LANGUAGES) {
    let score = 0;
    for (const marker of LANGUAGE_MARKERS[lang]) {
      score += (clean.match(marker) || []).length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }

  return bestScore >= 2 ? best : null;
}

export function resolveRequestedBookLanguage(
  language?: string | null,
  locale?: string | null,
  manuallySelected?: boolean,
  sourceText?: string | null,
): SupportedBookLanguage {
  const explicitLanguage = isSupportedBookLanguage(language) ? language : null;

  // 1. The author explicitly picked a language → always win.
  if (manuallySelected && explicitLanguage) return explicitLanguage;

  // 2. Otherwise the language of what they typed decides.
  const detected = detectLanguageFromText(sourceText);
  if (detected) return detected;

  // 3. Fall back to any stored language, then the interface locale.
  return explicitLanguage ?? resolveBookLanguageFromLocale(locale) ?? 'en';
}
