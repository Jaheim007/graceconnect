/**
 * SSR-safe read of the document language.
 * On the server there is no `document`; return the default locale ('fr'),
 * which matches the SSR-rendered <html lang="fr"> so hydration stays consistent.
 */
export function docLang(): string {
  return typeof document !== 'undefined' ? document.documentElement.lang : 'fr';
}
