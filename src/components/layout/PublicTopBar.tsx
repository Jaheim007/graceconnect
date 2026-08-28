import { useNavigate } from '@/lib/router-compat';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { cn } from '@/lib/utils';
import { isNativePlatform } from '@/lib/capacitor';

export function PublicTopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const nativeApp = isNativePlatform();

  return (
    <header
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
        paddingBottom: '0.5rem',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
        minHeight: 'calc(env(safe-area-inset-top, 0px) + 3.5rem)',
      }}
      className={cn(
        'sticky top-0 z-40 relative flex items-center gap-2 sm:gap-3',
        'border-b border-border/60 supports-[backdrop-filter]:bg-background/70 backdrop-blur-xl',
        'after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px',
        'after:bg-gradient-to-r after:from-transparent after:via-primary/40 after:to-transparent',
        nativeApp ? 'native-public-topbar bg-background/95' : 'glass'
      )}
    >

      {/* Ambient glow behind the bar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 left-1/4 h-32 w-56 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative flex h-9 items-center" aria-label="SiteViral">
        <SiteLogo size="sm" animate />
      </div>
      <div className="flex-1" />

      <div className="relative flex items-center gap-1.5">
        <GlobalPreferencesSelector className="h-9 rounded-full" />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full transition-transform hover:scale-110 hover:bg-primary/10"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {user && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 rounded-full hover:bg-primary/10" onClick={() => navigate('/my-purchases')}>
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('topbar.my_purchases')}</span>
          </Button>
        )}

        {!user && (
          <Button
            size="sm"
            className="h-9 rounded-full px-4 text-xs font-bold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => navigate('/auth')}
          >
            {t('topbar.sign_in')}
          </Button>
        )}
      </div>
    </header>
  );
}
