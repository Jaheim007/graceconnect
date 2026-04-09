import { useNavigate } from 'react-router-dom';
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
    <header className={cn(
      'sticky top-0 z-40 flex items-center gap-3 border-b border-border px-4',
      nativeApp ? 'native-public-topbar bg-background/95 py-2' : 'h-14 glass'
    )}>
      <div className="flex items-center gap-2">
        <SiteLogo size="sm" animate />
        <span className={cn('text-sm font-semibold tracking-tight text-foreground', !nativeApp && 'hidden sm:inline')}>
          SiteViral
        </span>
      </div>
      <div className="flex-1" />

      <GlobalPreferencesSelector />

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {user && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/resources')}>
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('topbar.my_purchases')}</span>
        </Button>
      )}

      {!user && (
        <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/auth')}>
          {t('topbar.sign_in')}
        </Button>
      )}
    </header>
  );
}