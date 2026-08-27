import { useNavigate } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
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

  const perks = isFr
    ? ['Gratuit pour commencer', "L'IA fait le plus dur", 'Publie et vends en 1 clic']
    : ['Free to start', 'AI does the heavy lifting', 'Publish and sell in one tap'];

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <header className="relative h-14 sticky top-0 z-40 glass border-b border-border/60 flex items-center px-4 gap-3 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/40 after:to-transparent">
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full transition-transform hover:scale-110 hover:bg-primary/10"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-12 pb-32 lg:pb-12">
        <div className="max-w-md w-full text-center space-y-7">
          <div className="relative mx-auto h-20 w-20">
            <div className={cn('absolute inset-0 rounded-3xl blur-xl opacity-60', iconBg)} />
            <div className={cn('relative h-20 w-20 rounded-3xl flex items-center justify-center border border-border/50 shadow-lg', iconBg)}>
              <Icon className={cn('h-9 w-9', iconColor)} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              {isFr ? 'Gratuit pour commencer' : 'Free to start'}
            </p>
            <h1 className="text-3xl font-black tracking-tight leading-[1.1]">{title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          </div>

          <ul className="mx-auto flex w-full max-w-xs flex-col gap-2 text-left">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" />
                </span>
                <span className="text-xs font-medium">{p}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2 rounded-xl text-sm font-bold shadow-xl shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0"
              onClick={() => goAuth('signup')}
            >
              {isFr ? 'Créer mon compte gratuit' : 'Create my free account'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
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
