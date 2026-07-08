import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

const POPULAR = [
  { fr: 'Coiffure', en: 'Hair', route: '/beauty' },
  { fr: 'Tutorat', en: 'Tutoring', route: '/education' },
  { fr: 'Plomberie', en: 'Plumbing', route: '/home' },
  { fr: 'Événements', en: 'Events', route: '/events' },
  { fr: 'Ebooks', en: 'Ebooks', route: '/discover?type=digital' },
  { fr: 'Musique', en: 'Music', route: '/discover?type=music' },
];

export function MarketplaceHero() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIntent('client', '/looking-for');
    navigate(q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : '/looking-for');
  };

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--accent)/0.35), transparent 50%), radial-gradient(circle at 80% 60%, hsl(var(--primary)/0.4), transparent 55%)' }} />

      <div className="relative container max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            {fr ? 'Talents & services vérifiés en Afrique et au-delà' : 'Verified talents & services across Africa and beyond'}
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
            {fr ? (
              <>Trouvez le bon <span className="text-accent">pro</span>. <br className="hidden sm:block"/>Ou vendez vos <span className="text-accent">services</span>.</>
            ) : (
              <>Find the right <span className="text-accent">pro</span>. <br className="hidden sm:block"/>Or sell your <span className="text-accent">services</span>.</>
            )}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-sidebar-foreground/70 max-w-2xl">
            {fr
              ? "Beauté, cours, artisans, événements, produits digitaux — une seule plateforme, paiement sécurisé, Mobile Money inclus."
              : 'Beauty, tutoring, artisans, events, digital products — one platform, secure payment, Mobile Money included.'}
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="flex-1 flex items-center gap-2 rounded-xl bg-white/95 text-foreground px-4 h-14 shadow-lg">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={fr ? 'Essayez "coiffure à domicile" ou "prof de maths"' : 'Try "home hairstyling" or "math tutor"'}
                className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              {fr ? 'Rechercher' : 'Search'}
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-sidebar-foreground/60 mr-1">{fr ? 'Populaire :' : 'Popular:'}</span>
            {POPULAR.map((p) => (
              <button
                key={p.route}
                onClick={() => { setIntent('client', p.route); navigate(p.route); }}
                className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-accent/60 hover:bg-white/5 transition"
              >
                {fr ? p.fr : p.en}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-sidebar-foreground/70">
            <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-accent" /> 4.9/5 {fr ? 'satisfaction' : 'satisfaction'}</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" /> {fr ? 'Paiement protégé' : 'Protected payment'}</div>
            <div className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-accent" /> {fr ? 'Réponse < 1h' : 'Reply < 1h'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketplaceIntentSplit() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <section className="container max-w-6xl px-4 py-16">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => { setIntent('client', '/looking-for'); navigate('/looking-for'); }}
          className="group text-left rounded-2xl border bg-card p-6 sm:p-8 hover:border-primary/50 hover:shadow-lg transition"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            {fr ? 'Je cherche' : 'I am looking'}
          </div>
          <h3 className="mt-2 text-2xl font-bold">
            {fr ? 'Trouver un pro ou un produit' : 'Find a pro or a product'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {fr ? 'Parcourez les catégories, comparez, réservez en toute sécurité.' : 'Browse categories, compare, book securely.'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {fr ? 'Explorer' : 'Explore'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </button>

        <button
          onClick={() => { setIntent('provider'); navigate('/start'); }}
          className="group text-left rounded-2xl border p-6 sm:p-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:shadow-xl transition"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-accent">
            {fr ? 'Je propose' : 'I offer'}
          </div>
          <h3 className="mt-2 text-2xl font-bold">
            {fr ? 'Vendre mes services ou produits' : 'Sell my services or products'}
          </h3>
          <p className="mt-2 text-sm text-primary-foreground/85">
            {fr ? "Créez votre espace en 5 minutes. On prépare les bons outils pour votre activité." : 'Set up in 5 minutes. We prepare the right tools for your activity.'}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
            {fr ? 'Commencer' : 'Get started'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </button>
      </div>
    </section>
  );
}
