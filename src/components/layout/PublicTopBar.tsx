import { useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';

export function PublicTopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <header className="h-14 sticky top-0 z-40 glass border-b border-border flex items-center px-4 gap-3">
      <SiteLogo size="sm" animate />
      <div className="flex-1" />

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