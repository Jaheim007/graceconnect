import { useNavigate } from 'react-router-dom';
import { Scissors, GraduationCap, Wrench, Church, ShoppingBag, CalendarDays, Music, Megaphone, Briefcase, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

type Cat = {
  icon: typeof Scissors;
  fr: string; en: string;
  route: string;
  gradient: string;
  fromFr: string; fromEn: string;
};

const CATS: Cat[] = [
  { icon: Scissors,      fr: 'Beauté',            en: 'Beauty',           route: '/beauty/search',
    gradient: 'from-pink-500 via-rose-500 to-orange-400',
    fromFr: 'À partir de 2 500 F', fromEn: 'From $5' },
  { icon: GraduationCap, fr: 'Cours & tuteurs',   en: 'Tutoring',         route: '/learn/discover',
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    fromFr: 'À partir de 3 000 F/h', fromEn: 'From $6/h' },
  { icon: Wrench,        fr: 'Artisans',          en: 'Home & artisans',  route: '/home/discover',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    fromFr: 'Devis gratuit', fromEn: 'Free quote' },
  { icon: CalendarDays,  fr: 'Événements',        en: 'Events',           route: '/events/discover',
    gradient: 'from-fuchsia-500 via-purple-500 to-indigo-600',
    fromFr: 'Packs sur mesure', fromEn: 'Custom packages' },
  { icon: Church,        fr: 'Églises',           en: 'Churches',         route: '/church/discover',
    gradient: 'from-violet-500 via-purple-500 to-slate-600',
    fromFr: 'Espace ministère', fromEn: 'Ministry space' },
  { icon: ShoppingBag,   fr: 'Produits digitaux', en: 'Digital products', route: '/discover?type=digital',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    fromFr: 'Dès 1 000 F', fromEn: 'From $2' },
  { icon: Music,         fr: 'Musique & audio',   en: 'Music & audio',    route: '/discover?type=music',
    gradient: 'from-indigo-500 via-blue-600 to-slate-700',
    fromFr: 'Beats, mixage…', fromEn: 'Beats, mixing…' },
  { icon: Megaphone,     fr: 'Influenceurs',      en: 'Influencers',      route: '/discover?type=influencer',
    gradient: 'from-yellow-500 via-orange-500 to-pink-500',
    fromFr: 'Campagnes sponso', fromEn: 'Sponsored posts' },
  { icon: Briefcase,     fr: 'Tous les services', en: 'All services',     route: '/discover',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    fromFr: 'Voir tout', fromEn: 'Browse all' },
];

export function MarketplaceCategories() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <section className="container max-w-6xl px-4 py-16 sm:py-20">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {fr ? 'Parcourir les catégories' : 'Browse categories'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
            {fr ? 'Des milliers de pros vérifiés dans les catégories les plus demandées.' : 'Thousands of verified pros across the most in-demand categories.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/discover')}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {fr ? 'Voir tout' : 'View all'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATS.map((c) => (
          <button
            key={c.route + c.en}
            onClick={() => { setIntent('client', c.route); navigate(c.route); }}
            className="group relative overflow-hidden rounded-2xl border bg-card text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Gradient artwork */}
            <div className={`relative aspect-[5/3] bg-gradient-to-br ${c.gradient} overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
              <div className="absolute bottom-3 left-3 h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md grid place-items-center ring-1 ring-white/30">
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-full ring-1 ring-white/25">
                {fr ? c.fromFr : c.fromEn}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base font-bold">{fr ? c.fr : c.en}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
