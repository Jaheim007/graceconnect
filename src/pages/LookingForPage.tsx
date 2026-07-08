import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Scissors, GraduationCap, Wrench, Church, ShoppingBag, CalendarDays, Music, Megaphone, Briefcase } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

interface Choice {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  fr: string;
  en: string;
  route: string;
}

const CHOICES: Choice[] = [
  { key: 'beauty',    icon: Scissors,      fr: 'Trouver un pro beauté',              en: 'Find a beauty pro',            route: '/beauty' },
  { key: 'tutor',     icon: GraduationCap, fr: 'Trouver un tuteur / prof à domicile', en: 'Find a tutor / home teacher', route: '/education' },
  { key: 'artisan',   icon: Wrench,        fr: 'Trouver un artisan / service à domicile', en: 'Find an artisan / home service', route: '/home' },
  { key: 'church',    icon: Church,        fr: 'Trouver une église / ministère',      en: 'Find a church / ministry',    route: '/church' },
  { key: 'digital',   icon: ShoppingBag,   fr: 'Acheter des produits digitaux',       en: 'Buy digital products',        route: '/discover?type=digital' },
  { key: 'events',    icon: CalendarDays,  fr: 'Trouver un événement',                en: 'Find an event',               route: '/events' },
  { key: 'music',     icon: Music,         fr: 'Trouver un musicien / instrumentiste', en: 'Find a musician / instrumentist', route: '/discover?type=music' },
  { key: 'influencer',icon: Megaphone,     fr: 'Trouver un influenceur',              en: 'Find an influencer',          route: '/discover?type=influencer' },
  { key: 'general',   icon: Briefcase,     fr: 'Trouver un service général',          en: 'Find a general service',      route: '/discover' },
];

export default function LookingForPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const pick = (c: Choice) => {
    // Preserve buyer intent so post-auth routing sends them back here.
    setIntent('client', c.route);
    try { localStorage.setItem('sv_last_vertical', c.key); } catch {}
    navigate(c.route);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <SEOHead
        title={fr ? 'Que cherchez-vous ? — SiteViral' : 'What are you looking for? — SiteViral'}
        description={fr ? 'Trouvez un service, un pro, un produit ou un événement.' : 'Find a service, a pro, a product or an event.'}
      />

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {fr ? 'Découvrir' : 'Discover'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          {fr ? 'Que cherchez-vous ?' : 'What are you looking for?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fr
            ? 'Choisissez une catégorie pour continuer.'
            : 'Pick a category to continue.'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHOICES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pick(c)}
            className="group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-sm font-semibold">{fr ? c.fr : c.en}</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition" />
          </button>
        ))}
      </div>

      <div className="pt-2 text-center">
        <button
          onClick={() => { setIntent('provider'); navigate('/start'); }}
          className="text-xs text-muted-foreground hover:text-primary transition"
        >
          {fr ? 'Je veux plutôt proposer ou vendre →' : 'I want to offer or sell instead →'}
        </button>
      </div>
    </div>
  );
}
