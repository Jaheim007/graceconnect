import { Link, useNavigate } from 'react-router-dom';
import { Church, ArrowRight, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Dedicated header for the standalone church funnel (/churches).
 * No generic Discover / creator menus — one identity, one action.
 */
export function ChurchNav({ onStart }: { onStart: () => void }) {
  const { locale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const fr = locale === 'fr';
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/churches" className="group flex items-center gap-2.5" aria-label="SiteViral for Churches">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
            <span className="absolute inset-0 rounded-xl bg-primary/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            <SiteLogo size="sm" linked={false} className="relative" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-tight">SiteViral</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {fr ? 'Églises' : 'Churches'}
            </span>
          </span>
        </Link>


        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GlobalPreferencesSelector />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hidden sm:inline-flex rounded-full hover:bg-muted/60"
            onClick={toggleTheme}
            aria-label={fr ? 'Changer de thème' : 'Toggle theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/auth?mode=signin')}
            className="hidden sm:inline-flex h-10 px-4 text-sm font-semibold"
          >
            {fr ? 'Se connecter' : 'Sign in'}
          </Button>
          <Button onClick={onStart} className="h-10 gap-1.5 px-4 text-sm font-bold">
            {fr ? 'Créer mon espace église' : 'Create my church space'}
            <ArrowRight className="hidden h-3.5 w-3.5 sm:block" />
          </Button>
        </div>
      </div>
    </header>
  );
}
