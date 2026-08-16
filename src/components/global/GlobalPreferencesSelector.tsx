import { Globe, ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES, Locale } from '@/i18n/locales';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Compact language selector for navbar */
export function GlobalPreferencesSelector({ className }: { className?: string } = {}) {
  const { locale, setLocale } = useI18n();
  const { user } = useAuth();

  const handleLocaleChange = async (l: Locale) => {
    setLocale(l);
    if (user) {
      await supabase.from('profiles').update({ preferred_language: l }).eq('id', user.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1 h-8 px-2 rounded-lg hover:bg-muted/60 transition-colors text-xs text-muted-foreground hover:text-foreground leading-none ${className ?? ''}`}>
          <Globe className="h-3.5 w-3.5" />
          <span className="font-semibold">{locale.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
