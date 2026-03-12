import { Globe, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES, Locale } from '@/i18n/locales';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';
import { useState, useEffect } from 'react';

const CURRENCY_FLAGS: Record<string, string> = {
  XOF: '🇨🇮',
  XAF: '🇨🇲',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  NGN: '🇳🇬',
  GHS: '🇬🇭',
  KES: '🇰🇪',
  ZAR: '🇿🇦',
  GBP: '🇬🇧',
  MAD: '🇲🇦',
  TND: '🇹🇳',
};

/** Compact language + currency selector for navbar */
export function GlobalPreferencesSelector() {
  const { locale, setLocale } = useI18n();
  const { user, profile } = useAuth();

  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('sv_display_currency') || profile?.preferred_currency || detectCurrencyFromTimezone();
  });

  // Sync from profile on login
  useEffect(() => {
    if (profile?.preferred_currency) {
      setCurrencyState(profile.preferred_currency);
      localStorage.setItem('sv_display_currency', profile.preferred_currency);
    }
  }, [profile?.preferred_currency]);

  const handleLocaleChange = async (l: Locale) => {
    setLocale(l);
    if (user) {
      await supabase.from('profiles').update({ preferred_language: l }).eq('id', user.id);
    }
  };

  const handleCurrencyChange = async (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('sv_display_currency', c);
    window.dispatchEvent(new CustomEvent('sv:currency-change', { detail: { currency: c } }));
    if (user) {
      await supabase.from('profiles').update({ preferred_currency: c }).eq('id', user.id);
    }
  };

  const currentCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  const currentCurrencyFlag = CURRENCY_FLAGS[currency] || '🌍';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-muted/60 transition-colors text-xs text-muted-foreground hover:text-foreground">
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{locale === 'en' ? '🇬🇧' : '🇫🇷'} {locale.toUpperCase()}</span>
          <span className="text-[10px] opacity-60">|</span>
          <span className="hidden sm:inline">{currentCurrencyFlag} {currentCurrencyInfo?.symbol || currency}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {locale === 'fr' ? 'Langue' : 'Language'}
        </DropdownMenuLabel>
        {SUPPORTED_LOCALES.filter(l => l !== 'ar').map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={`text-xs gap-2 ${locale === l ? 'font-bold text-primary' : ''}`}
          >
            {l === 'en' ? '🇬🇧' : '🇫🇷'} {LOCALE_LABELS[l]}
            {locale === l && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {locale === 'fr' ? 'Devise d\'affichage' : 'Display currency'}
        </DropdownMenuLabel>
        <div className="max-h-48 overflow-y-auto">
          {SUPPORTED_CURRENCIES.map((c) => (
            <DropdownMenuItem
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={`text-xs gap-2 ${currency === c.code ? 'font-bold text-primary' : ''}`}
            >
              <span className="w-8 text-xs">{CURRENCY_FLAGS[c.code] || '🌍'}</span>
              <span>{c.code}</span>
              {currency === c.code && <span className="ml-auto text-primary">✓</span>}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
