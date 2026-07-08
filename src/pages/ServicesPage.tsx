import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Church,
  Globe,
  GraduationCap,
  Heart,
  LifeBuoy,
  LogOut,
  Mail,
  Megaphone,
  Music,
  Package,
  Search,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  User,
  Wrench,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductCard } from '@/components/products/ProductCard';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';


type ServiceCategory = {
  key: string;
  route: string;
  icon: typeof Search;
  fr: string;
  en: string;
  hintFr: string;
  hintEn: string;
  keywords: string[];
};

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    key: 'beauty',
    route: '/beauty/search',
    icon: Scissors,
    fr: 'Beauté',
    en: 'Beauty',
    hintFr: 'Coiffure, ongles, maquillage',
    hintEn: 'Hair, nails, makeup',
    keywords: ['beauty', 'beauté', 'coiffure', 'ongles', 'makeup', 'maquillage'],
  },
  {
    key: 'learn',
    route: '/learn/discover',
    icon: GraduationCap,
    fr: 'Cours & tuteurs',
    en: 'Tutors',
    hintFr: 'Aide scolaire, langues, coaching',
    hintEn: 'School help, languages, coaching',
    keywords: ['cours', 'tuteur', 'prof', 'maths', 'learn', 'teacher', 'school'],
  },
  {
    key: 'home',
    route: '/home/discover',
    icon: Wrench,
    fr: 'Artisans',
    en: 'Artisans',
    hintFr: 'Plomberie, électricité, maison',
    hintEn: 'Plumbing, electricity, home',
    keywords: ['artisan', 'plomberie', 'maison', 'réparation', 'home', 'repair'],
  },
  {
    key: 'events',
    route: '/events/discover',
    icon: CalendarDays,
    fr: 'Événements',
    en: 'Events',
    hintFr: 'Traiteur, déco, billets',
    hintEn: 'Catering, decor, tickets',
    keywords: ['event', 'événement', 'mariage', 'traiteur', 'ticket', 'billet'],
  },
  {
    key: 'church',
    route: '/church/discover',
    icon: Church,
    fr: 'Églises',
    en: 'Churches',
    hintFr: 'Ministères, dons, rendez-vous',
    hintEn: 'Ministries, giving, appointments',
    keywords: ['church', 'église', 'eglise', 'pasteur', 'sermon', 'prière'],
  },
  {
    key: 'digital',
    route: '/discover?type=digital',
    icon: ShoppingBag,
    fr: 'Produits digitaux',
    en: 'Digital products',
    hintFr: 'Livres, guides, formations',
    hintEn: 'Books, guides, courses',
    keywords: ['digital', 'ebook', 'livre', 'book', 'guide', 'formation'],
  },
  {
    key: 'music',
    route: '/discover?type=music',
    icon: Music,
    fr: 'Musique & audio',
    en: 'Music & audio',
    hintFr: 'Beats, mixage, voix',
    hintEn: 'Beats, mixing, voice',
    keywords: ['music', 'musique', 'audio', 'beat', 'mixage', 'voix'],
  },
  {
    key: 'influencers',
    route: '/discover?type=influencer',
    icon: Megaphone,
    fr: 'Influenceurs',
    en: 'Influencers',
    hintFr: 'Créateurs, campagnes, UGC',
    hintEn: 'Creators, campaigns, UGC',
    keywords: ['influenceur', 'influencer', 'ugc', 'creator', 'campagne'],
  },
];

const QUICK_RECOMMENDATIONS = [
  { key: 'brief', icon: Package, route: '/home/discover', fr: 'Publier une demande', en: 'Post a service request', subFr: 'Décris ton besoin et compare les réponses.', subEn: 'Describe your need and compare replies.' },
  { key: 'books', icon: BookOpen, route: '/discover?type=digital', fr: 'Explorer les livres', en: 'Explore books', subFr: 'Guides, ebooks, enseignements et ressources.', subEn: 'Guides, ebooks, teachings and resources.' },
  { key: 'events', icon: CalendarDays, route: '/events/discover', fr: 'Trouver un événement', en: 'Find an event', subFr: 'Billets, prestations et organisateurs.', subEn: 'Tickets, services and organizers.' },
];

const FEATURED_SERVICES = [
  { category: 'digital', route: '/discover?type=digital', titleFr: 'Livre ou guide digital', titleEn: 'Digital book or guide', seller: 'SiteViral Digital', priceFr: 'Dès 1 000 F', priceEn: 'From $2' },
  { category: 'beauty', route: '/beauty/search?cat=Coiffure', titleFr: 'Service de coiffure', titleEn: 'Hairstyling service', seller: 'Pros beauté vérifiés', priceFr: 'Dès 2 500 F', priceEn: 'From $5' },
  { category: 'learn', route: '/learn/discover?q=maths', titleFr: 'Cours de maths', titleEn: 'Math tutoring', seller: 'Tuteurs à domicile', priceFr: 'Dès 3 000 F/h', priceEn: 'From $6/h' },
  { category: 'home', route: '/home/discover?q=plomberie', titleFr: 'Service de plomberie', titleEn: 'Plumbing service', seller: 'Artisans qualifiés', priceFr: 'Devis gratuit', priceEn: 'Free quote' },
  { category: 'church', route: '/church/discover', titleFr: 'Église ou ministère', titleEn: 'Church or ministry', seller: 'Communautés locales', priceFr: 'Découvrir', priceEn: 'Discover' },
  { category: 'music', route: '/discover?type=music', titleFr: 'Beatmaking & audio', titleEn: 'Beatmaking & audio', seller: 'Créateurs audio', priceFr: 'Dès 5 000 F', priceEn: 'From $10' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { locale, setLocale } = useI18n();
  const isFr = locale === 'fr';
  const initialQuery = params.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('all');

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const firstName = displayName.split(' ')[0];
  const initials = displayName ? displayName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() : 'SV';

  const { data: digitalProducts = [] } = useQuery({
    queryKey: ['services-digital-products'],
    queryFn: async () => {
      const { data, error } = await db.from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
        org_kyc_status: p.organizations?.kyc_status,
        org_category: p.organizations?.category,
      }));
    },
    staleTime: 60_000,
  });


  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICE_CATEGORIES;
    return SERVICE_CATEGORIES.filter((item) =>
      [item.fr, item.en, item.hintFr, item.hintEn, ...item.keywords].some((value) => value.toLowerCase().includes(q)),
    );
  }, [query]);

  const featured = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FEATURED_SERVICES.filter((service) => {
      const matchesCategory = category === 'all' || service.category === category;
      if (!q) return matchesCategory;
      return matchesCategory && [service.titleFr, service.titleEn, service.seller].some((value) => value.toLowerCase().includes(q));
    });
  }, [category, query]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    setIntent('client', '/services');

    if (category !== 'all') {
      const selected = SERVICE_CATEGORIES.find((item) => item.key === category);
      if (selected) {
        const separator = selected.route.includes('?') ? '&' : '?';
        navigate(q ? `${selected.route}${separator}q=${encodeURIComponent(q)}` : selected.route);
        return;
      }
    }

    setParams(q ? { q } : {}, { replace: true });
  };

  const go = (route: string) => {
    setIntent('client', route);
    navigate(route);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SEOHead
        title={isFr ? 'Services — SiteViral' : 'Services — SiteViral'}
        description={isFr ? 'Cherchez un service, un pro, un livre, un événement ou un produit digital sur SiteViral.' : 'Search for a service, pro, book, event or digital product on SiteViral.'}
        canonicalUrl="https://siteviral.com/services"
      />

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <SiteLogo size="md" to="/services" animate />

          <form onSubmit={submitSearch} className="hidden flex-1 items-center md:flex">
            <div className="relative w-full max-w-2xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isFr ? 'Quel service cherchez-vous aujourd’hui ?' : 'What service are you looking for today?'}
                className="h-10 rounded-r-none border-r-0 pl-9"
              />
            </div>
            <Button type="submit" className="h-10 rounded-l-none px-4" aria-label={isFr ? 'Rechercher' : 'Search'}>
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            <Button variant="ghost" size="sm" onClick={() => go('/start-selling')} className="text-xs font-semibold">
              {isFr ? 'Proposer un service' : 'Offer a service'}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={isFr ? 'Notifications' : 'Notifications'}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={isFr ? 'Messages' : 'Messages'}>
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={isFr ? 'Favoris' : 'Favorites'}>
              <Heart className="h-4 w-4" />
            </Button>
          </nav>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-label={isFr ? 'Menu profil' : 'Profile menu'}>
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-bold">{displayName || (isFr ? 'Mon compte' : 'My account')}</span>
                  {user.email && <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> {isFr ? 'Profil' : 'Profile'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-programs')}>
                  <BookOpen className="mr-2 h-4 w-4" /> {isFr ? 'Mes achats' : 'My purchases'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/bookmarks')}>
                  <Heart className="mr-2 h-4 w-4" /> {isFr ? 'Favoris' : 'Favorites'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('/start-selling')}>
                  <Store className="mr-2 h-4 w-4" /> {isFr ? 'Proposer un service' : 'Become a seller'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <Package className="mr-2 h-4 w-4" /> {isFr ? 'Tableau de bord vendeur' : 'Seller dashboard'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" /> {isFr ? 'Paramètres du compte' : 'Account settings'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/billing')}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> {isFr ? 'Facturation & paiements' : 'Billing & payments'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setLocale(isFr ? 'en' : 'fr'); }}>
                  <Globe className="mr-2 h-4 w-4" /> {isFr ? 'Langue : Français' : 'Language: English'}
                  <span className="ml-auto text-xs text-muted-foreground">{isFr ? 'EN' : 'FR'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/help')}>
                  <LifeBuoy className="mr-2 h-4 w-4" /> {isFr ? 'Support' : 'Support'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate('/'); }}>
                  <LogOut className="mr-2 h-4 w-4" /> {isFr ? 'Se déconnecter' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/auth?returnTo=/services')}>
              {isFr ? 'Connexion' : 'Sign in'}
            </Button>
          )}
        </div>

        <div className="border-t border-border/70">
          <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 py-2 no-scrollbar">
            {SERVICE_CATEGORIES.map((item) => (
              <button
                key={item.key}
                onClick={() => setCategory(item.key)}
                onDoubleClick={() => go(item.route)}
                className={cn(
                  'shrink-0 text-xs font-medium text-muted-foreground transition hover:text-foreground',
                  category === item.key && 'text-foreground',
                )}
              >
                {isFr ? item.fr : item.en}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {isFr ? 'Services, produits et pros vérifiés' : 'Verified services, products and pros'}
              </div>
              <div>
                <h1 className="text-2xl font-black leading-tight sm:text-4xl">
                  {firstName
                    ? (isFr ? `Bienvenue, ${firstName}` : `Welcome, ${firstName}`)
                    : (isFr ? 'Bienvenue dans votre espace services' : 'Welcome to your services space')}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {isFr
                    ? 'Cherchez un pro, un livre, un événement ou un produit digital sans passer par le tableau de bord vendeur.'
                    : 'Search for a pro, book, event or digital product without going through the seller dashboard.'}
                </p>
              </div>

              <form onSubmit={submitSearch} className="flex rounded-xl border border-border bg-background p-1 shadow-sm md:hidden">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={isFr ? 'Que cherchez-vous ?' : 'What are you looking for?'}
                    className="h-10 border-0 pl-9 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" size="icon" className="h-10 w-10" aria-label={isFr ? 'Rechercher' : 'Search'}>
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {QUICK_RECOMMENDATIONS.map((item) => (
                <button key={item.key} onClick={() => go(item.route)} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left shadow-sm transition hover:border-primary/50">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{isFr ? item.fr : item.en}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{isFr ? item.subFr : item.subEn}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isFr ? 'Catégories populaires' : 'Popular categories'}
            </div>
            <div className="grid gap-1">
              <button
                onClick={() => setCategory('all')}
                className={cn('flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-muted', category === 'all' && 'bg-muted')}
              >
                {isFr ? 'Tout explorer' : 'Explore all'} <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {SERVICE_CATEGORIES.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCategory(item.key)}
                  className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-muted', category === item.key && 'bg-muted')}
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="flex-1">{isFr ? item.fr : item.en}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">{isFr ? 'Recommandé pour vous' : 'Recommended for you'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isFr ? 'Les premières portes d’entrée pour chercher sur SiteViral.' : 'The first entry points for searching on SiteViral.'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => go('/discover')} className="hidden text-xs sm:inline-flex">
                  {isFr ? 'Voir tout' : 'See all'}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCategories.slice(0, 6).map((item) => (
                  <button key={item.key} onClick={() => go(item.route)} className="group rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{isFr ? item.fr : item.en}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{isFr ? item.hintFr : item.hintEn}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">{isFr ? 'Services et ressources à explorer' : 'Services and resources to explore'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isFr ? 'Même avant les premières annonces, l’interface reste orientée recherche.' : 'Even before the first live listings, the interface stays search-first.'}
                  </p>
                </div>
              </div>

              {featured.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((service) => (
                    <Link key={service.route + service.titleEn} to={service.route} onClick={() => setIntent('client', service.route)} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50 hover:shadow-md">
                      <div className="flex aspect-[4/3] items-center justify-center bg-muted/70">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-background text-primary shadow-sm">
                          <ShoppingBag className="h-7 w-7" />
                        </div>
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-current text-accent" /> 4.9 · {service.seller}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary">{isFr ? service.titleFr : service.titleEn}</h3>
                        <p className="text-sm font-black">{isFr ? service.priceFr : service.priceEn}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <User className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">{isFr ? 'Aucun résultat pour cette recherche.' : 'No result for this search.'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{isFr ? 'Essayez une autre catégorie ou explorez tous les services.' : 'Try another category or explore all services.'}</p>
                  <Button variant="outline" size="sm" onClick={() => { setQuery(''); setCategory('all'); setParams({}, { replace: true }); }} className="mt-4 text-xs">
                    {isFr ? 'Réinitialiser' : 'Reset'}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}