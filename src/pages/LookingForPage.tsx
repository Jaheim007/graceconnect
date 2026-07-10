import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, GraduationCap, Wrench, Church, ShoppingBag, CalendarDays, Check } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { useBuyerWorld } from '@/hooks/useBuyerWorld';
import { normalizeBuyerWorld } from '@/lib/siteviral/buyerWorlds';
import { OnboardingShell } from '@/components/layout/OnboardingShell';
import { cn } from '@/lib/utils';

interface Choice {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  fr: string;
  en: string;
  subFr: string;
  subEn: string;
  route: string;
}

const CHOICES: Choice[] = [
  { key: 'beauty',  icon: Scissors,      fr: 'Beauté',    en: 'Beauty',    subFr: 'Coiffure, ongles, maquillage',       subEn: 'Hair, nails, makeup',              route: '/dashboard/explore?world=beauty' },
  { key: 'tutor',   icon: GraduationCap, fr: 'Éducation', en: 'Education', subFr: 'Tuteurs et cours à domicile',        subEn: 'Tutors & home teachers',           route: '/dashboard/explore?world=education' },
  { key: 'artisan', icon: Wrench,        fr: 'Maison',    en: 'Home',      subFr: 'Artisans et services à domicile',    subEn: 'Artisans & home services',         route: '/dashboard/explore?world=home' },
  { key: 'church',  icon: Church,        fr: 'Église',    en: 'Church',    subFr: 'Églises, ministères, sermons',       subEn: 'Churches, ministries, sermons',    route: '/dashboard/explore?world=church' },
  { key: 'digital', icon: ShoppingBag,   fr: 'Digital',   en: 'Digital',   subFr: 'Ebooks, cours, produits digitaux',   subEn: 'Ebooks, courses, digital goods',   route: '/dashboard/explore?world=digital' },
  { key: 'events',  icon: CalendarDays,  fr: 'Événements', en: 'Events',   subFr: 'Traiteurs, DJ, salles, prestataires', subEn: 'Caterers, DJs, venues, vendors',  route: '/dashboard/explore?world=events' },
];

export default function LookingForPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { setBuyerWorld } = useBuyerWorld();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const proceed = () => {
    const c = CHOICES.find((x) => x.key === selectedKey);
    if (!c) return;
    setIntent('client', c.route);
    try { localStorage.setItem('sv_last_vertical', c.key); } catch {}
    const world = normalizeBuyerWorld(c.key);
    if (world) { void setBuyerWorld(world); }
    navigate(c.route);
  };

  return (
    <>
      <SEOHead
        title={fr ? 'Que cherchez-vous ? — SiteViral' : 'What are you looking for? — SiteViral'}
        description={fr ? 'Trouvez le service qu’il vous faut.' : 'Find the service you need.'}
      />
      <OnboardingShell
        step={2}
        totalSteps={3}
        onClose={() => navigate('/')}
        onBack={() => navigate(-1)}
        primaryLabel={fr ? 'Étape suivante' : 'Next step'}
        onPrimary={proceed}
        primaryDisabled={!selectedKey}
        secondaryLabel={fr ? 'Étape précédente' : 'Previous step'}
        onSecondary={() => navigate('/welcome-intent')}
      >
        <div className="space-y-8">
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
            {fr ? 'Que cherchez-vous ?' : 'What are you looking for?'}
          </h1>

          <div className="space-y-3">
            {CHOICES.map((c) => {
              const isSel = selectedKey === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedKey(c.key)}
                  className={cn(
                    'w-full rounded-2xl p-5 text-left transition-all flex items-center gap-4 border',
                    isSel
                      ? 'bg-foreground text-background border-foreground shadow-lg'
                      : 'bg-card text-foreground border-border/60 hover:border-foreground/40'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold leading-tight">{fr ? c.fr : c.en}</div>
                    <div className={cn('text-sm mt-1', isSel ? 'text-background/70' : 'text-muted-foreground')}>
                      {fr ? c.subFr : c.subEn}
                    </div>
                  </div>
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    isSel ? 'bg-background/15' : 'bg-muted'
                  )}>
                    {isSel ? <Check className="h-5 w-5" /> : <c.icon className="h-5 w-5" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => { setIntent('provider'); navigate('/start'); }}
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
