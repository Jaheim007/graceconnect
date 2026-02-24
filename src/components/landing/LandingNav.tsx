import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/i18n/I18nContext';

export function LandingNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
      <div className="container flex items-center justify-between h-14 px-4">
        <span className="text-xl font-extrabold tracking-tight text-foreground">Siteviral</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/features">Fonctionnalités</Link></Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/affiliate-program">Affiliation</Link></Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/about">{t('landing.about')}</Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=signin')} className="text-xs sm:text-sm px-2 sm:px-3">{t('landing.sign_in')}</Button>
          <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4" onClick={() => navigate('/auth?mode=signup')}>
            {t('landing.get_started')}
          </Button>
        </div>
      </div>
    </header>
  );
}
