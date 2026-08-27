import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { useBuyerWorld } from '@/hooks/useBuyerWorld';
import { normalizeBuyerWorld, type BuyerWorld } from '@/lib/siteviral/buyerWorlds';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';

/**
 * Multi-select interest picker (inspired by the "Choose your interests" pattern).
 * Buyers pick one or more worlds; we persist the whole list in `sv_interests`
 * so future logins skip this step and go straight to their personalized feed.
 * The first pick is the primary world used to shape the explore landing.
 */

interface Interest {
  key: BuyerWorld;
  emoji: string;
  fr: string;
  en: string;
}

const INTERESTS: Interest[] = [
  { key: 'digital',   emoji: '📚', fr: 'Digital & Ebooks',    en: 'Digital & Ebooks' },
  { key: 'beauty',    emoji: '💅', fr: 'Beauté & Style',      en: 'Beauty & Style' },
  { key: 'home',      emoji: '🛠️', fr: 'Artisans',             en: 'Artisans' },
  { key: 'events',    emoji: '🎉', fr: 'Événements',           en: 'Events' },
  { key: 'education', emoji: '🎓', fr: 'Éducation & Coachs',   en: 'Education & Coaches' },
  { key: 'other',     emoji: '', fr: 'Autres services',      en: 'Other services' },
];

export default function LookingForPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { setBuyerWorld } = useBuyerWorld();
  const [selected, setSelected] = useState<BuyerWorld[]>(() => {
    try {
      const raw = localStorage.getItem('sv_interests');
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return arr.map((k) => normalizeBuyerWorld(k)).filter(Boolean) as BuyerWorld[];
    } catch { return []; }
  });

  const toggle = (k: BuyerWorld) => {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const proceed = () => {
    if (selected.length === 0) return;
    const primary = selected[0];
    try {
      localStorage.setItem('sv_interests', JSON.stringify(selected));
      localStorage.setItem('sv_last_vertical', primary);
    } catch {}
    void setBuyerWorld(primary);
    const route = `/dashboard/explore?world=${primary}`;
    setIntent('client', route);
    navigate(route);
  };

  return (
    <>
      <SEOHead
        title={fr ? 'Choisissez vos centres d’intérêt — SiteViral' : 'Choose your interests — SiteViral'}
        description={fr ? 'Personnalisez votre découverte.' : 'Personalize your discovery feed.'}
        noindex
      />
      <OnboardingShell
        step={2}
        totalSteps={3}
        onClose={() => navigate('/')}
        onBack={() => navigate(-1)}
        primaryLabel={fr ? 'Continuer' : 'Continue'}
        onPrimary={proceed}
        primaryDisabled={selected.length === 0}
        secondaryLabel={fr ? 'Passer' : 'Skip'}
        onSecondary={() => navigate('/dashboard/explore')}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {fr ? 'Choisissez vos centres d’intérêt' : 'Choose your interests'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {fr
                ? 'Nous personnaliserons votre page Explorer selon vos choix. Sélectionnez-en autant que vous voulez.'
                : 'We’ll shape your Explore feed from your picks. Choose as many as you like.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {INTERESTS.map((i) => {
              const isSel = selected.includes(i.key);
              return (
                <button
                  key={i.key}
                  type="button"
                  onClick={() => toggle(i.key)}
                  aria-pressed={isSel}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
                    isSel
                      ? 'bg-foreground text-background border-foreground shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border/60 hover:border-foreground/40'
                  )}
                >
                  <span className="text-base leading-none">{i.emoji}</span>
                  <span>{fr ? i.fr : i.en}</span>
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {fr
                ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''} • Premier choix = univers principal`
                : `${selected.length} selected • First pick = primary world`}
            </p>
          )}

          <div className="pt-4 text-center">
            <button
              onClick={() => { setIntent('provider'); navigate('/create-org'); }}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              {fr ? 'Je veux plutôt proposer ou vendre →' : 'I want to offer or sell instead →'}
            </button>
          </div>
        </div>
      </OnboardingShell>
    </>
  );
}
