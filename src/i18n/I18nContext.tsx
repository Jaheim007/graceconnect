import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'; 
import translations, { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './locales';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

/** Detect best locale from browser */
function detectBrowserLocale(): Locale {
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
  ];
  for (const lang of candidates) {
    const short = lang?.slice(0, 2).toLowerCase() as Locale;
    if (SUPPORTED_LOCALES.includes(short)) return short;
  }
  return 'fr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // 1. Check if user manually chose a locale
    const wasManual = localStorage.getItem('sv_locale_manual') === '1';
    if (wasManual) {
      const saved = localStorage.getItem('sv_locale') as Locale | null;
      if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
    }
    // 2. Check profile preference (set by AuthContext after login)
    const profileLang = localStorage.getItem('sv_profile_locale') as Locale | null;
    if (profileLang && SUPPORTED_LOCALES.includes(profileLang)) return profileLang;
    // 3. Auto-detect from browser
    return detectBrowserLocale();
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  // Listen for profile locale updates (fired by AuthContext after profile fetch)
  useEffect(() => {
    const handler = (e: CustomEvent<{ locale: Locale }>) => {
      const wasManual = localStorage.getItem('sv_locale_manual') === '1';
      if (!wasManual && SUPPORTED_LOCALES.includes(e.detail.locale)) {
        setLocaleState(e.detail.locale);
      }
    };
    window.addEventListener('sv:profile-locale' as any, handler as any);
    return () => window.removeEventListener('sv:profile-locale' as any, handler as any);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('sv_locale', l);
    localStorage.setItem('sv_locale_manual', '1');
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
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
