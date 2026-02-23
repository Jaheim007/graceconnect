import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import translations, { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('sv_locale') as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
    const browserLang = navigator.language.slice(0, 2) as Locale;
    return SUPPORTED_LOCALES.includes(browserLang) ? browserLang : DEFAULT_LOCALE;
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('sv_locale', l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string): string => translations[locale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
