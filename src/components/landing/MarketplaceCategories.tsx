import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, GraduationCap, Wrench, Church, ShoppingBag, CalendarDays, Music, Megaphone, Briefcase, Search, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

type Cat = {
  key: string;
  icon: typeof Scissors;
  fr: string; en: string;
  findRoute: string;
  proposeRoute: string;
  gradient: string;
};

const CATS: Cat[] = [
  { key: 'beauty',      icon: Scissors,      fr: 'Beauté',            en: 'Beauty',           findRoute: '/beauty/search',            proposeRoute: '/start?activity=beauty',     gradient: 'from-pink-500 via-rose-500 to-orange-400' },
  { key: 'plumbing',    icon: Wrench,        fr: 'Plomberie',         en: 'Plumbing',         findRoute: '/home/discover?q=plomberie', proposeRoute: '/start?activity=home',       gradient: 'from-amber-500 via-orange-500 to-red-500' },
  { key: 'tutors',      icon: GraduationCap, fr: 'Cours & tuteurs',   en: 'Tutors',           findRoute: '/learn/discover',           proposeRoute: '/start?activity=learn',      gradient: 'from-sky-500 via-blue-500 to-indigo-500' },
  { key: 'events',      icon: CalendarDays,  fr: 'Événements',        en: 'Events',           findRoute: '/events/discover',          proposeRoute: '/start?activity=events',     gradient: 'from-fuchsia-500 via-purple-500 to-indigo-600' },
  { key: 'digital',     icon: ShoppingBag,   fr: 'Produits digitaux', en: 'Digital products', findRoute: '/discover?type=digital',    proposeRoute: '/start?activity=digital',    gradient: 'from-emerald-500 via-teal-500 to-cyan-500' },
  { key: 'music',       icon: Music,         fr: 'Musique & audio',   en: 'Music & audio',    findRoute: '/discover?type=music',      proposeRoute: '/start?activity=music',      gradient: 'from-indigo-500 via-blue-600 to-slate-700' },
  { key: 'church',      icon: Church,        fr: 'Églises',           en: 'Churches',         findRoute: '/church/discover',          proposeRoute: '/start?activity=church',     gradient: 'from-violet-500 via-purple-500 to-slate-600' },
  { key: 'influencers', icon: Megaphone,     fr: 'Influenceurs',      en: 'Influencers',      findRoute: '/discover?type=influencer', proposeRoute: '/start?activity=influencer', gradient: 'from-yellow-500 via-orange-500 to-pink-500' },
  { key: 'all',         icon: Briefcase,     fr: 'Tous les services', en: 'All services',     findRoute: '/discover',                 proposeRoute: '/start',                     gradient: 'from-slate-700 via-slate-800 to-slate-900' },
];

export function MarketplaceCategories() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [picked, setPicked] = useState<Cat | null>(null);

  const go = (route: string, kind: 'client' | 'provider') => {
    setIntent(kind, route);
    setPicked(null);
    navigate(route);
  };

  return (
    <section className="container max-w-6xl px-4 py-10 sm:py-12">
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {fr ? 'Choisissez une catégorie' : 'Pick a category'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {fr ? 'Tapez pour trouver ou pour proposer ce service.' : 'Tap to find or to offer that service.'}
          </p>
        </div>
      </div>

      {/* Horizontal snap slider */}
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 snap-x snap-mandatory pb-2">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setPicked(c)}
              className="snap-start shrink-0 w-[150px] sm:w-[180px] group relative overflow-hidden rounded-2xl border bg-card text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`relative aspect-[5/4] bg-gradient-to-br ${c.gradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_60%)]" />
                <div className="absolute bottom-2 left-2 h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md grid place-items-center ring-1 ring-white/30">
                  <c.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="p-3">
                <span className="text-sm font-bold">{fr ? c.fr : c.en}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Find or Propose chooser */}
      <Dialog open={!!picked} onOpenChange={(o) => !o && setPicked(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {picked ? (fr ? picked.fr : picked.en) : ''}
            </DialogTitle>
            <DialogDescription>
              {fr ? 'Que voulez-vous faire dans cette catégorie ?' : 'What do you want to do in this category?'}
            </DialogDescription>
          </DialogHeader>
          {picked && (
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <button
                onClick={() => go(picked.findRoute, 'client')}
                className="rounded-2xl border p-4 text-left hover:border-primary/60 hover:shadow-md transition"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center mb-2">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="font-bold text-sm">
                  {fr ? 'Je cherche' : 'I\'m looking'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fr ? 'Voir les pros et réserver.' : 'Browse pros and book.'}
                </p>
              </button>
              <button
                onClick={() => go(picked.proposeRoute, 'provider')}
                className="rounded-2xl border p-4 text-left bg-primary text-primary-foreground hover:shadow-lg transition"
              >
                <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center mb-2">
                  <Rocket className="h-5 w-5" />
                </div>
                <div className="font-bold text-sm">
                  {fr ? 'Je propose' : 'I offer'}
                </div>
                <p className="text-xs text-primary-foreground/85 mt-1">
                  {fr ? 'Publier mon service ici.' : 'List my service here.'}
                </p>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
