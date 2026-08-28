import { useNavigate } from '@/lib/router-compat';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { cn } from '@/lib/utils';

export function PublicTopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <header
      className={cn(
        'mobile-safe-topbar sticky top-0 z-40 grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-safe-x sm:gap-3',
        'border-b border-border/60 supports-[backdrop-filter]:bg-background/70 backdrop-blur-xl',
        'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px',
        'after:bg-gradient-to-r after:from-transparent after:via-primary/40 after:to-transparent',
        'bg-background/95'
      )}
    >

      {/* Ambient glow behind the bar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 left-1/4 h-32 w-56 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative flex h-11 min-w-0 items-center" aria-label="SiteViral">
        <SiteLogo size="sm" animate />
      </div>

      <div className="relative flex min-w-0 items-center justify-end gap-0.5 min-[360px]:gap-1.5">
        <GlobalPreferencesSelector className="h-11 rounded-full px-1.5 min-[360px]:px-2" />

        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full transition-transform hover:scale-105 hover:bg-primary/10"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {user && (
          <Button variant="ghost" size="sm" className="h-11 text-xs gap-1.5 rounded-full hover:bg-primary/10" onClick={() => navigate('/my-purchases')}>
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('topbar.my_purchases')}</span>
          </Button>
        )}

        {!user && (
          <Button
            size="sm"
            className="h-11 shrink-0 rounded-full px-3 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 min-[360px]:px-4"
            onClick={() => navigate('/auth')}
          >
            {t('topbar.sign_in')}
          </Button>
        )}
      </div>
    </header>
  );
}
