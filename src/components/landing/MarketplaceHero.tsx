import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

const CATEGORIES_FOR_SEARCH = [
  { value: '', fr: 'Toutes catégories', en: 'All categories' },
  { value: '/beauty/search',    fr: 'Beauté',       en: 'Beauty' },
  { value: '/learn/discover', fr: 'Cours',        en: 'Tutoring' },
  { value: '/home/discover',      fr: 'Artisans',     en: 'Home services' },
  { value: '/events/discover',    fr: 'Événements',   en: 'Events' },
  { value: '/discover?type=digital', fr: 'Digital', en: 'Digital' },
  { value: '/discover?type=music',   fr: 'Musique', en: 'Music' },
];

export function MarketplaceHero() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIntent('client', '/services');
    const base = cat || '/discover';
    if (q.trim()) {
      const sep = base.includes('?') ? '&' : '?';
      navigate(`${base}${sep}q=${encodeURIComponent(q.trim())}`);
    } else {
      navigate(base);
    }
  };

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground pt-14">
      {/* Layered brand-tinted background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, hsl(var(--accent)/0.35), transparent 55%), radial-gradient(circle at 85% 70%, hsl(var(--primary)/0.45), transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative container max-w-6xl px-4 py-12 sm:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider mb-6 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            {fr ? 'Marketplace panafricaine · Services vérifiés' : 'Pan-African marketplace · Verified services'}
          </div>

          <h1 className="text-[2.5rem] sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight">
            {fr ? (
              <>
                Trouvez le bon <span className="text-accent">service</span>,<br className="hidden sm:block" />
                <span className="text-sidebar-foreground/90">au bon prix.</span>
              </>
            ) : (
              <>
                Find the right <span className="text-accent">service</span>,<br className="hidden sm:block" />
                <span className="text-sidebar-foreground/90">at the right price.</span>
              </>
            )}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-sidebar-foreground/70 max-w-2xl leading-relaxed">
            {fr
              ? 'Beauté, tuteurs, artisans, événements, produits digitaux — réservez en 2 minutes. Paiement protégé, Mobile Money inclus.'
              : 'Beauty, tutors, artisans, events, digital products — book in 2 minutes. Protected payment, Mobile Money included.'}
          </p>

          {/* Premium search bar with category dropdown */}
          <form
            onSubmit={submit}
            className="mt-8 flex flex-col md:flex-row gap-2 max-w-3xl rounded-2xl md:rounded-full bg-white/95 text-foreground p-2 shadow-2xl shadow-black/30"
          >
            <div className="flex-1 flex items-center gap-2 px-4">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={fr ? 'Quel service cherchez-vous aujourd’hui ?' : 'What service are you looking for today?'}
                className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder:text-muted-foreground h-12"
              />
            </div>
            <div className="hidden md:flex items-center border-l border-border pl-1">
              <Select value={cat || 'all'} onValueChange={(v) => setCat(v === 'all' ? '' : v)}>
                <SelectTrigger
                  className="h-12 min-w-[170px] border-0 bg-transparent text-sm font-semibold text-foreground shadow-none focus:ring-0 focus:ring-offset-0 rounded-full hover:bg-muted/60 transition"
                  aria-label={fr ? 'Catégorie' : 'Category'}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/80 shadow-xl">
                  {CATEGORIES_FOR_SEARCH.map((c) => (
                    <SelectItem
                      key={c.value || 'all'}
                      value={c.value || 'all'}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {fr ? c.fr : c.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 rounded-xl md:rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg"
            >
              <Search className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">{fr ? 'Rechercher' : 'Search'}</span>
            </Button>
          </form>

          {/* Popular chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-sidebar-foreground/60 mr-1 inline-flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> {fr ? 'Populaire :' : 'Popular:'}
            </span>
            {POPULAR.map((p) => (
              <button
                key={p.route + p.en}
                onClick={() => { setIntent('client', p.route); navigate(p.route); }}
                className="text-xs px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:border-accent/60 hover:bg-white/10 transition"
              >
                {fr ? p.fr : p.en}
              </button>
            ))}
          </div>

          {/* Propose CTA — inline, single screen */}
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-1">
                {fr ? 'Vous êtes un pro ?' : 'Are you a pro?'}
              </div>
              <h2 className="text-lg sm:text-xl font-black leading-snug">
                {fr ? 'Proposez vos services à des millions de personnes.' : 'Offer your services to millions of people.'}
              </h2>
            </div>
            <Button
              size="lg"
              onClick={() => { setIntent('provider', '/start'); navigate('/start'); }}
              className="h-12 px-6 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold shadow-lg whitespace-nowrap"
            >
              {fr ? 'Proposer mes services' : 'Offer my services'}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sidebar-foreground/75">
            <div className="flex items-center gap-1.5">
              <div className="flex text-accent">
                {[0,1,2,3,4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <span className="font-semibold">4.9/5</span>
            </div>
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
          onClick={() => { setIntent('client', '/services'); navigate('/services'); }}
          className="group text-left rounded-3xl border bg-card p-7 sm:p-9 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {fr ? 'Je cherche un service' : 'I need a service'}
          </div>
          <h3 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">
            {fr ? 'Trouvez le service qu’il vous faut et réservez.' : 'Find the service you need and book it.'}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {fr ? 'Comparez les profils vérifiés, discutez, réservez et payez en toute sécurité.' : 'Compare verified profiles, chat, book and pay securely.'}
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            {fr ? 'Explorer' : 'Explore'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </div>
        </button>

        <button
          onClick={() => { setIntent('provider'); navigate('/start-selling'); }}
          className="group text-left rounded-3xl border p-7 sm:p-9 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground hover:shadow-2xl hover:-translate-y-0.5 transition-all relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {fr ? 'Je propose' : 'I offer'}
            </div>
            <h3 className="mt-3 text-2xl sm:text-3xl font-black leading-tight">
              {fr ? 'Vendez vos services et gagnez plus.' : 'Sell your services and earn more.'}
            </h3>
            <p className="mt-3 text-sm text-primary-foreground/85 leading-relaxed">
              {fr ? 'Créez votre boutique en 5 minutes. Outils pros, paiements Mobile Money, clients qualifiés.' : 'Set up in 5 minutes. Pro tools, Mobile Money payouts, qualified clients.'}
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold">
              {fr ? 'Proposer mes services' : 'Offer my services'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
