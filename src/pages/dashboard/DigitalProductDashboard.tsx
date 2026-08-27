import { useMemo } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CheckCircle2, FileCheck, GraduationCap, Package, Plus, Receipt, Share2, ShoppingBag, Zap, TrendingUp, Wallet } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { brandUrl } from '@/lib/storageUrl';
import { cn } from '@/lib/utils';

type ProductRow = {
  id: string;
  title: string;
  product_type: string | null;
  price: number | null;
  currency: string | null;
  cover_image_url: string | null;
  is_published: boolean | null;
  sales_count: number | null;
  created_at: string;
};

type SaleRow = {
  id: string;
  amount: number | null;
  currency: string | null;
  completed_at: string | null;
  created_at: string;
  digital_products?: { title?: string | null } | null;
};

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-semibold text-foreground">{label}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  primary = false,
}: {
  icon: typeof Package;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md',
        primary ? 'border-primary/30 bg-primary/5' : 'bg-card'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('grid h-10 w-10 place-items-center rounded-lg', primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{title}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </button>
  );
}

export default function DigitalProductDashboard() {
  const { user, profile } = useAuth();
  const { currentOrg, userOrgs, isLoadingOrgs } = useOrg();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  const org = currentOrg ?? userOrgs[0] ?? null;
  const orgId = org?.id;
  const currency = org?.currency || DEFAULT_CURRENCY;
  const firstName = (profile?.display_name || user?.email?.split('@')[0] || (isFr ? 'là' : 'there')).split(' ')[0];

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['digital-dashboard-products', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from('digital_products')
        .select('id,title,product_type,price,currency,cover_image_url,is_published,sales_count,created_at')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data || []) as unknown as ProductRow[];
    },
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['digital-dashboard-sales', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await db
        .from('product_purchases')
        .select('id,amount,currency,completed_at,created_at,digital_products(title)')
        .eq('organization_id', orgId!)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []) as unknown as SaleRow[];
    },
  });

  const { data: programCount = 0 } = useQuery({
    queryKey: ['digital-dashboard-program-count', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count } = await db
        .from('programs')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!);
      return count ?? 0;
    },
  });

  const { data: affiliateCount = 0 } = useQuery({
    queryKey: ['digital-dashboard-affiliates', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { count } = await db
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId!)
        .eq('is_active', true);
      return count ?? 0;
    },
  });

  const stats = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
    const published = products.filter((product) => product.is_published).length;
    return { revenue, published };
  }, [products, sales]);

  const fmt = (amount: number, nextCurrency?: string | null) => formatCurrency(amount, nextCurrency || currency, locale);
  const hasOrg = !!orgId;
  const loading = isLoadingOrgs || loadingProducts || loadingSales;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Dashboard digital — SiteViral" noindex />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="rounded-md">
              {isFr ? 'Boutique digitale' : 'Digital products'}
            </Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {isFr ? `Salut ${firstName}, construis tes ventes digitales.` : `Hi ${firstName}, grow your digital sales.`}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {hasOrg
                ? isFr
                  ? `${org?.name} est ton espace pour créer, publier, vendre et suivre tes produits digitaux.`
                  : `${org?.name} is your space to create, publish, sell, and track digital products.`
                : isFr
                  ? 'Crée d’abord ta boutique digitale pour vendre ebooks, formations, templates et contenus téléchargeables.'
                  : 'Create your digital store first to sell ebooks, courses, templates, and downloads.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <Button onClick={() => navigate(hasOrg ? '/admin/products/new' : '/create-org')} className="gap-2">
              <Plus className="h-4 w-4" /> {isFr ? 'Nouveau produit' : 'New product'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/ecrire')} className="gap-2">
               {isFr ? 'Écrire avec IA' : 'Write with AI'}
            </Button>
          </div>
        </section>

        {!hasOrg ? (
          <section className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="max-w-xl">
              <h2 className="text-xl font-black tracking-tight">{isFr ? 'Démarre ta boutique digitale' : 'Start your digital store'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isFr
                  ? 'Ton dashboard digital apparaîtra ici dès que ta première plateforme est créée.'
                  : 'Your digital dashboard will appear here as soon as your first platform is created.'}
              </p>
              <Button className="mt-5 gap-2" onClick={() => navigate('/create-org')}>
                <ShoppingBag className="h-4 w-4" /> {isFr ? 'Créer ma boutique' : 'Create my store'}
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)
              ) : (
                <>
                  <MetricCard
                    icon={Package}
                    label={isFr ? 'Produits' : 'Products'}
                    value={String(products.length)}
                    hint={isFr ? `${stats.published} publiés` : `${stats.published} published`}
                  />
                  <MetricCard
                    icon={Receipt}
                    label={isFr ? 'Ventes' : 'Sales'}
                    value={String(sales.length)}
                    hint={isFr ? 'Commandes confirmées' : 'Confirmed orders'}
                  />
                  <MetricCard
                    icon={TrendingUp}
                    label={isFr ? 'Revenus' : 'Revenue'}
                    value={fmt(stats.revenue)}
                    hint={isFr ? 'Produits digitaux' : 'Digital products'}
                  />
                  <MetricCard
                    icon={Share2}
                    label={isFr ? 'Affiliés' : 'Affiliates'}
                    value={String(affiliateCount)}
                    hint={isFr ? 'Liens ambassadeurs actifs' : 'Active ambassador links'}
                  />
                </>
              )}
            </section>

            <section className="grid gap-3 lg:grid-cols-3">
              <ActionCard
                primary
                icon={ShoppingBag}
                title={isFr ? 'Créer un ebook, template ou fichier' : 'Create an ebook, template, or file'}
                description={isFr ? 'Ajoute ton produit, fixe le prix et publie la page de vente.' : 'Add your product, set the price, and publish the sales page.'}
                onClick={() => navigate('/admin/products/new')}
              />
              <ActionCard
                icon={GraduationCap}
                title={isFr ? 'Créer une formation' : 'Create a course'}
                description={isFr ? 'Transforme ton expertise en programme vendable.' : 'Turn your expertise into a sellable program.'}
                onClick={() => navigate('/admin/programs')}
              />
              <ActionCard
                icon={BookOpen}
                title={isFr ? 'Générer un livre avec IA' : 'Generate a book with AI'}
                description={isFr ? 'Prépare un livre ou un contenu que tu peux vendre ensuite.' : 'Prepare a book or content you can sell next.'}
                onClick={() => navigate('/ecrire')}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black tracking-tight">{isFr ? 'Produits digitaux' : 'Digital products'}</h2>
                    <p className="text-xs text-muted-foreground">{isFr ? 'Tes derniers produits et formations.' : 'Your latest products and courses.'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/products')}>
                    {isFr ? 'Tout voir' : 'View all'}
                  </Button>
                </div>

                {loadingProducts ? (
                  <Skeleton className="h-64 rounded-xl" />
                ) : products.length === 0 && programCount === 0 ? (
                  <div className="rounded-xl border border-dashed bg-card p-8 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold">{isFr ? 'Aucun produit pour le moment' : 'No products yet'}</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      {isFr ? 'Commence avec un ebook, une formation, un template ou un fichier téléchargeable.' : 'Start with an ebook, course, template, or downloadable file.'}
                    </p>
                    <Button className="mt-5 gap-2" onClick={() => navigate('/admin/products/new')}>
                      <Plus className="h-4 w-4" /> {isFr ? 'Créer mon premier produit' : 'Create my first product'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        className="group flex gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {product.cover_image_url ? (
                            <img src={brandUrl(product.cover_image_url)} alt={product.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-muted-foreground">
                              <BookOpen className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 text-sm font-bold">{product.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge variant={product.is_published ? 'default' : 'secondary'} className="rounded-md text-[10px]">
                              {product.is_published ? (isFr ? 'Publié' : 'Published') : (isFr ? 'Brouillon' : 'Draft')}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{fmt(Number(product.price || 0), product.currency)}</span>
                          </div>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {product.sales_count || 0} {isFr ? 'vente(s)' : 'sale(s)'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border bg-card p-4">
                  <h2 className="text-sm font-black tracking-tight">{isFr ? 'Configuration essentielle' : 'Essential setup'}</h2>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        icon: FileCheck,
                        title: isFr ? 'Vérification KYC' : 'KYC verification',
                        desc: org?.kyc_status && org.kyc_status !== 'none' ? (isFr ? 'Dossier en cours ou validé' : 'Submitted or verified') : (isFr ? 'Requis avant retrait' : 'Required before payout'),
                        route: '/admin/kyc',
                      },
                      {
                        icon: Wallet,
                        title: isFr ? 'Paiements & retraits' : 'Payments & payouts',
                        desc: isFr ? 'Gérer l’argent reçu' : 'Manage money received',
                        route: '/admin/payouts',
                      },
                      {
                        icon: Share2,
                        title: isFr ? 'Affiliation' : 'Affiliation',
                        desc: isFr ? 'Ambassadeurs et commissions' : 'Ambassadors and commissions',
                        route: '/admin/affiliation',
                      },
                    ].map((item) => (
                      <button key={item.title} onClick={() => navigate(item.route)} className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition hover:border-primary/30">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold">{item.title}</div>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                  <h2 className="text-sm font-black tracking-tight">{isFr ? 'Dernières ventes' : 'Latest sales'}</h2>
                  {sales.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">{isFr ? 'Aucune vente confirmée pour le moment.' : 'No confirmed sales yet.'}</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {sales.slice(0, 4).map((sale) => (
                        <div key={sale.id} className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold">{sale.digital_products?.title || (isFr ? 'Produit digital' : 'Digital product')}</div>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(sale.completed_at || sale.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                            </p>
                          </div>
                          <span className="text-xs font-bold">{fmt(Number(sale.amount || 0), sale.currency)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </section>
          </>
        )}
      </div>
    </div>
  );
}