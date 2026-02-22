import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, Filter, ShoppingBag, Heart, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgCard } from '@/components/org/OrgCard';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePublicOrgs } from '@/hooks/useOrganizations';
import { OrgCategory } from '@/types/database';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { motion } from 'framer-motion';
import { useDirectoryMode } from '@/hooks/useDirectoryMode';

const CATEGORIES: { value: OrgCategory | ''; label: string }[] = [
  { value: '', label: 'Tout' },
  { value: 'church', label: '🏢 Organisation' },
  { value: 'ministry', label: '🤝 Association' },
  { value: 'leader', label: '⭐ Leader' },
  { value: 'ngo', label: '🌍 ONG' },
  { value: 'community', label: '👥 Communauté' },
  { value: 'other', label: '🔷 Autre' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<OrgCategory | ''>('');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('communities');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const { data: directoryMode = 'curated' } = useDirectoryMode();

  const { data, isLoading } = usePublicOrgs({ search, category, page });
  const orgs = data?.orgs || [];
  const total = data?.total || 0;
  const pageSize = 12;

  // Products & Campaigns for marketplace tabs
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['discover-products', search],
    queryFn: async () => {
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .order('sales_count', { ascending: false })
        .limit(50);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
      }));
    },
    enabled: tab === 'products',
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['discover-campaigns', search],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('current_amount', { ascending: false })
        .limit(50);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
      }));
    },
    enabled: tab === 'campaigns',
  });

  // Directory mode filtering
  const filteredOrgs = directoryMode === 'curated'
    ? orgs.filter((o: any) => o.is_verified || o.is_featured)
    : orgs;

  // Verified orgs for showcase
  const verifiedOrgs = filteredOrgs.filter((o: any) => o.is_verified);

  return (
    <div className="bg-background min-h-screen">
      <SEOHead title="Explorer — Communautés, Produits & Campagnes" description="Découvrez les meilleures communautés, produits numériques et campagnes de collecte sur Siteviral." />
      {/* Compact hero */}
      <div className="border-b border-border/40 py-6 px-4">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-gold" />
            <h1 className="text-xl sm:text-2xl font-bold">Explorer</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Communautés, produits et campagnes à découvrir.</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-10 h-11 bg-card/80"
            />
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6">
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(0); }}>
          <TabsList className="mb-6">
            <TabsTrigger value="communities" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Communautés
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> Produits
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Campagnes
            </TabsTrigger>
          </TabsList>

          {/* ─── COMMUNITIES TAB ─── */}
          <TabsContent value="communities">
            {/* Verified showcase */}
            {verifiedOrgs.length > 0 && !search && !category && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Communautés vérifiées
                </h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {verifiedOrgs.slice(0, 6).map((org: any) => (
                    <button
                      key={org.id}
                      onClick={() => navigate(`/org/${org.slug}`)}
                      className="shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all w-24"
                    >
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-card border border-border">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full gold-gradient flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-foreground">{org.name?.slice(0, 2).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight line-clamp-2">{org.name}</span>
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setCategory(c.value); setPage(0); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${category === c.value ? 'bg-primary text-primary-foreground border-primary shadow-gold' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* CTA moved to bottom */}

            {!isLoading && directoryMode !== 'curated' && (
              <p className="text-xs text-muted-foreground mb-4">
                {total} organisation{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
                {search && ` pour "${search}"`}
              </p>
            )}

            {isLoading ? <SkeletonList count={9} /> : filteredOrgs.length === 0 ? (
              <EmptyState variant={search ? 'search' : 'orgs'} action={!search ? { label: 'Effacer les filtres', onClick: () => { setCategory(''); setSearch(''); } } : undefined} />
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredOrgs.map((org, i) => <OrgCard key={org.id} org={org} index={i} />)}</div>
            )}

            {total > pageSize && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</Button>
                <span className="text-xs text-muted-foreground">Page {page + 1} sur {Math.ceil(total / pageSize)}</span>
                <Button variant="outline" size="sm" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Suivant</Button>
              </div>
            )}

            {/* Create org CTA — bottom */}
            {user && (
              <div className="mt-8 p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">Vous êtes un leader ?</p>
                  <p className="text-xs text-muted-foreground">Lancez votre page communautaire sur Siteviral</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate('/create-org')}>+ Créer</Button>
              </div>
            )}
          </TabsContent>

          {/* ─── PRODUCTS TAB ─── */}
          <TabsContent value="products">
            {loadingProducts ? <SkeletonList count={8} /> : products.length === 0 ? (
              <EmptyState variant="search" title="Aucun produit trouvé" />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p: any) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* ─── CAMPAIGNS TAB ─── */}
          <TabsContent value="campaigns">
            {loadingCampaigns ? <SkeletonList count={6} /> : campaigns.length === 0 ? (
              <EmptyState variant="search" title="Aucune campagne trouvée" />
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((c: any) => (
                  <motion.div key={c.id} variants={fadeUp}>
                    <CampaignCard campaign={c} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
