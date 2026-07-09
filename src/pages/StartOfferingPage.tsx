import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Check } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StartShell } from '@/components/start/StartShell';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { resolveActivity } from '@/lib/siteviral/moduleToFeatures';
import { MARKET_CATS } from '@/lib/marketplaceCats';

interface Option {
  key: string;                 // marketplace cat key
  emoji: string;
  activityParam: string;       // ?activity=<param>
}

// Keep landing-page verticals aligned with marketplaceCats keys.
const OPTIONS: Option[] = [
  { key: 'digital',     emoji: '🛒', activityParam: 'digital' },
  { key: 'artisans',    emoji: '🛠️', activityParam: 'home' },
  { key: 'beauty',      emoji: '💅', activityParam: 'beauty' },
  { key: 'church',      emoji: '⛪', activityParam: 'church' },
  { key: 'influencers', emoji: '📣', activityParam: 'influencer' },
  { key: 'sport',       emoji: '🏋️', activityParam: 'sport' },
  { key: 'tutors',      emoji: '🎓', activityParam: 'learn' },
  { key: 'music',       emoji: '🎼', activityParam: 'music' },
  { key: 'general',     emoji: '💼', activityParam: 'general' },
];

const CONFIG_KEY = 'sv_start_config';

export default function StartOfferingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const preselect = params.get('activity');
  const [picked, setPicked] = useState<string | null>(() => {
    if (preselect) {
      const r = resolveActivity(preselect);
      return r.activityKey;
    }
    return null;
  });

  useEffect(() => {
    if (preselect) {
      const r = resolveActivity(preselect);
      setPicked(r.activityKey);
    }
  }, [preselect]);

  const options = useMemo(
    () => OPTIONS.map((o) => {
      const cat = MARKET_CATS.find((c) => c.key === o.key)!;
      return { ...o, label: fr ? cat.fr : cat.en, gradient: cat.gradient };
    }),
    [fr],
  );

  const submit = () => {
    if (!picked) {
      toast.error(fr ? 'Choisissez une activité' : 'Pick one activity');
      return;
    }
    const activityParam = OPTIONS.find((o) => o.key === picked)?.activityParam || picked;
    const resolved = resolveActivity(activityParam);
    // Seed sv_start_config so downstream flows apply the correct siteviral type + features
    try {
      const existing = JSON.parse(sessionStorage.getItem(CONFIG_KEY) || '{}');
      sessionStorage.setItem(CONFIG_KEY, JSON.stringify({
        ...existing,
        activity: activityParam,
        siteviral_type: resolved.siteviral_type,
        enabled_features: resolved.enabled_features,
      }));
    } catch {}

    // Digital products use the public 4-step "Créer ta plateforme" wizard
    if (picked === 'digital') {
      navigate('/create-org');
      return;
    }
    navigate(`/start/details?activity=${activityParam}`);
  };

  return (
    <StartShell step={1} onBack={() => navigate('/')}>
      <SEOHead
        title={fr ? 'Que proposez-vous ? — Siteviral' : 'What do you offer? — Siteviral'}
        description={fr ? 'Choisissez votre activité en un clic.' : 'Pick your activity in one tap.'}
        noindex
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Que proposez-vous ?' : 'What do you offer?'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr
              ? 'Une seule activité pour commencer. Vous pourrez en ajouter plus tard.'
              : 'One activity to start. You can add more later.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {options.map((o) => {
            const isSel = picked === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setPicked(o.key)}
                className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-start justify-between text-left transition-all overflow-hidden ${
                  isSel ? 'border-primary ring-2 ring-primary/30 shadow-lg' : 'hover:border-muted-foreground/40'
                }`}
              >
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${o.gradient}`} />
                <div className="relative text-2xl">{o.emoji}</div>
                <div className="relative text-[13px] font-bold leading-tight">
                  {o.label}
                </div>
                {isSel && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button onClick={submit} disabled={!picked} className="w-full h-12 gap-2 text-base font-bold">
          {fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </StartShell>
  );
}
