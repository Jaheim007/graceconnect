import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/i18n/I18nContext';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestGateProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  nextUrl: string;
}

export function GuestGate({ icon: Icon, iconBg = 'bg-primary/10', iconColor = 'text-primary', title, subtitle, nextUrl }: GuestGateProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isBeautyFlow = nextUrl.startsWith('/beauty');

  const goAuth = (mode?: 'signup') => {
    try { sessionStorage.setItem('sv_auth_returnTo', nextUrl); } catch {}
    const params = new URLSearchParams({ returnTo: nextUrl });
    if (mode) params.set('mode', mode);
    navigate(`/auth?${params.toString()}`);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="h-14 sticky top-0 z-40 glass border-b border-border flex items-center px-4 gap-3">
        {isBeautyFlow ? (
          <button
            type="button"
            onClick={() => { window.location.href = 'https://siteviral.com'; }}
            className="inline-flex"
            aria-label="SiteViral"
          >
            <SiteLogo size="sm" animate linked={false} />
          </button>
        ) : (
          <SiteLogo size="sm" animate linked to="/" />
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center mx-auto', iconBg)}>
            <Icon className={cn('h-8 w-8', iconColor)} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2 text-sm font-bold"
              onClick={() => goAuth('signup')}
            >
              <Zap className="h-4 w-4" />
              {isFr ? 'Créer mon compte gratuit' : 'Create my free account'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => goAuth()}
            >
              {isFr ? "J'ai déjà un compte" : 'I already have an account'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
