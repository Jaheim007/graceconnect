import { useNavigate } from 'react-router-dom';
import { Scissors, GraduationCap, Wrench, Church, ShoppingBag, CalendarDays, Music, Megaphone, Briefcase } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

const CATS = [
  { icon: Scissors,      fr: 'Beauté',            en: 'Beauty',           route: '/beauty' },
  { icon: GraduationCap, fr: 'Cours & tuteurs',   en: 'Tutoring',         route: '/education' },
  { icon: Wrench,        fr: 'Artisans',          en: 'Artisans',         route: '/home' },
  { icon: CalendarDays,  fr: 'Événements',        en: 'Events',           route: '/events' },
  { icon: Church,        fr: 'Églises',           en: 'Churches',         route: '/church' },
  { icon: ShoppingBag,   fr: 'Produits digitaux', en: 'Digital products', route: '/discover?type=digital' },
  { icon: Music,         fr: 'Musique',           en: 'Music',            route: '/discover?type=music' },
  { icon: Megaphone,     fr: 'Influenceurs',      en: 'Influencers',      route: '/discover?type=influencer' },
  { icon: Briefcase,     fr: 'Services',          en: 'Services',         route: '/discover' },
];

export function MarketplaceCategories() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <section className="container max-w-6xl px-4 py-12 sm:py-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {fr ? 'Parcourir les catégories' : 'Browse categories'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {fr ? 'Choisissez ce qui vous intéresse' : 'Pick what you need'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATS.map((c) => (
          <button
            key={c.route}
            onClick={() => { setIntent('client', c.route); navigate(c.route); }}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-md transition text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0 group-hover:bg-primary/15">
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold">{fr ? c.fr : c.en}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
