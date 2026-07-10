import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Rocket, Check } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { useOrg } from '@/contexts/OrgContext';
import { useBuyerWorld } from '@/hooks/useBuyerWorld';
import { normalizeBuyerWorld } from '@/lib/siteviral/buyerWorlds';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';

type Kind = 'client' | 'provider';

export default function IntentChooserPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { userOrgs, canManage } = useOrg();
  const { setBuyerWorld } = useBuyerWorld();
  const fr = locale === 'fr';
  const [selected, setSelected] = useState<Kind | null>(null);

  const hasWorkspace = userOrgs.some((o) => canManage(o.id));

  const proceed = () => {
    if (!selected) return;
    if (selected === 'provider') {
      const route = hasWorkspace ? '/dashboard' : '/start';
      setIntent('provider', route);
      navigate(route);
      return;
    }
    setIntent('client', '/looking-for');
    try {
      const prev = normalizeBuyerWorld(localStorage.getItem('sv_last_vertical'));
      if (prev) void setBuyerWorld(prev);
    } catch {}
    navigate('/looking-for');
  };

  const options: Array<{
    kind: Kind;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
  }> = [
    {
      kind: 'client',
      icon: Search,
      title: fr ? 'Je cherche quelque chose' : "I'm looking for something",
      subtitle: fr
        ? 'Beauté, tuteur, artisan, église, digital, événements…'
        : 'Beauty, tutor, artisan, church, digital, events…',
    },
    {
      kind: 'provider',
      icon: Rocket,
      title: hasWorkspace
        ? (fr ? 'Aller à mon monde' : 'Go to my world')
        : (fr ? 'Je veux créer mon monde' : 'I want to create my world'),
      subtitle: hasWorkspace
        ? (fr ? 'Reprenez là où vous vous êtes arrêté.' : 'Pick up where you left off.')
        : (fr ? 'Beauté, digital, église, artisan, événements, cours.' : 'Beauty, digital, church, artisan, events, tutoring.'),
    },
  ];

  return (
    <>
      <SEOHead
        title={fr ? 'Bienvenue — SiteViral' : 'Welcome — SiteViral'}
        description={fr ? 'Que souhaitez-vous faire ?' : 'What would you like to do?'}
        noindex
      />
      <OnboardingShell
        step={1}
        totalSteps={selected === 'client' ? 3 : 2}
        onClose={() => navigate('/')}
        primaryLabel={fr ? 'Étape suivante' : 'Next step'}
        onPrimary={proceed}
        primaryDisabled={!selected}
      >
        <div className="space-y-8">
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
            {fr ? 'Quel est votre objectif ?' : "What's your goal?"}
          </h1>
          <div className="space-y-3">
            {options.map((o) => {
              const isSel = selected === o.kind;
              return (
                <button
                  key={o.kind}
                  type="button"
                  onClick={() => setSelected(o.kind)}
                  className={cn(
                    'group w-full rounded-2xl p-5 text-left transition-all flex items-center gap-4 border',
                    isSel
                      ? 'bg-foreground text-background border-foreground shadow-lg'
                      : 'bg-card text-foreground border-border/60 hover:border-foreground/40'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold leading-tight">{o.title}</div>
                    <div className={cn('text-sm mt-1', isSel ? 'text-background/70' : 'text-muted-foreground')}>
                      {o.subtitle}
                    </div>
                  </div>
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    isSel ? 'bg-background/15' : 'bg-muted'
                  )}>
                    {isSel ? <Check className="h-5 w-5" /> : <o.icon className="h-5 w-5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </OnboardingShell>
    </>
  );
}
