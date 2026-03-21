export const SUPPORTED_BOOK_LANGUAGES = ['fr', 'en', 'es', 'pt', 'de', 'sw'] as const;

export type SupportedBookLanguage = typeof SUPPORTED_BOOK_LANGUAGES[number];

export function isSupportedBookLanguage(value?: string | null): value is SupportedBookLanguage {
  return !!value && SUPPORTED_BOOK_LANGUAGES.includes(value as SupportedBookLanguage);
}

export function resolveBookLanguageFromLocale(locale?: string | null): SupportedBookLanguage | null {
  const shortLocale = locale?.slice(0, 2).toLowerCase();
  return isSupportedBookLanguage(shortLocale) ? shortLocale : null;
}

export function resolveRequestedBookLanguage(
  language?: string | null,
  locale?: string | null,
  manuallySelected?: boolean,
): SupportedBookLanguage {
  const explicitLanguage = isSupportedBookLanguage(language) ? language : null;
  const localeLanguage = resolveBookLanguageFromLocale(locale);

  if (manuallySelected && explicitLanguage) return explicitLanguage;
  if (localeLanguage) return localeLanguage;
  return explicitLanguage ?? 'en';
}