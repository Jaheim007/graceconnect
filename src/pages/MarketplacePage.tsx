import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, TrendingUp, Sparkles, Store, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [typeFilter, setTypeFilter] = useState('');
  const { mode } = useMode();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPublic = mode === 'public';
  const isAmbassador = mode === 'ambassador';

  // Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['marketplace-products', search, sortBy, typeFilter],
    queryFn: async () => {
      const orderCol = sortBy === 'commission' ? 'price' : sortBy === 'newest' ? 'created_at' : sortBy === 'bestseller' ? 'sales_count' : 'sales_count';
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, affiliation_commission_percent)')
        .eq('is_published', true)
        .order(orderCol, { ascending: false })
        .limit(60);
      if (search) q = q.ilike('title', `%${search}%`);
      if (typeFilter) q = q.eq('product_type', typeFilter);
      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        commission_percent: p.organizations?.affiliation_commission_percent,
      }));
    },
  });

  // Campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['marketplace-campaigns', search],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency)')
        .eq('is_published', true)
        .eq('is_active', true)
        .order('current_amount', { ascending: false })
        .limit(20);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
      }));
    },
  });

  // Sort filters differ by universe
  const publicSortFilters = [
    { key: 'newest', label: '✨ Nouveautés' },
    { key: 'bestseller', label: '🔥 Meilleures ventes' },
  ];

  const ambassadorSortFilters = [
    { key: 'commission', label: '💰 Meilleure commission' },
    { key: 'newest', label: '✨ Nouveautés' },
    { key: 'bestseller', label: '🔥 Meilleures ventes' },
  ];

  const sortFilters = isAmbassador ? ambassadorSortFilters : publicSortFilters;

  const pageTitle = isAmbassador ? 'Marketplace Ambassadeur' : 'Explorer';
  const pageDescription = isAmbassador
    ? 'Trouve des produits à partager et gagne des commissions.'
    : 'Explorez les meilleurs produits numériques.';

  return (
    <div className="bg-background min-h-screen">
      <SEOHead
        title={`${pageTitle} — Produits numériques | Siteviral`}
        description={pageDescription}
        canonicalUrl="https://siteviral.com/marketplace"
      />

      {/* Header */}
      <div className="border-b border-border bg-muted/30 py-8 px-4">
        <div className="container max-w-4xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-extrabold">{pageTitle}</h1>
            {isAmbassador && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                Mode Ambassadeur
              </span>
            )}
          </div>
          
          {/* Public CTA for non-logged users */}
          {isPublic && !user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Store className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">
                Connectez-vous pour acheter ou voir vos achats.
              </p>
              <Button size="sm" className="text-xs h-8 shrink-0" onClick={() => navigate('/auth')}>
                Se connecter
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sortFilters.map(f => (
                <Button
                  key={f.key}
                  variant={sortBy === f.key ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-9 gap-1"
                  onClick={() => setSortBy(sortBy === f.key ? 'popular' : f.key)}
                >
                  {f.label}
                </Button>
              ))}
              {['pdf', 'ebook', 'video', 'course', 'audio'].map(t => (
                <Button
                  key={t}
                  variant={typeFilter === t ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-9 capitalize"
                  onClick={() => setTypeFilter(typeFilter === t ? '' : t)}
                >
                  {t === 'pdf' ? 'PDF' : t === 'ebook' ? 'eBook' : t === 'video' ? 'Vidéo' : t === 'course' ? 'Cours' : 'Audio'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-6 px-4 space-y-6">
        {/* Products */}
        {isLoading ? <SkeletonList count={8} /> : products.length === 0 ? (
          <EmptyState variant="search" title="Aucun produit trouvé" />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {products.map((p: any) => (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard
                  product={p}
                  hideCommission={isPublic}
                  hideShare={isPublic}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Campaigns if any */}
        {campaigns.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="font-bold text-sm text-muted-foreground">Campagnes de dons</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c: any) => (
                <motion.div key={c.id} variants={fadeUp} initial="hidden" animate="visible">
                  <CampaignCard campaign={c} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Ambassador CTA at bottom for public users */}
        {isPublic && (
          <div className="pt-6 border-t border-border text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Vous souhaitez gagner des commissions en partageant ces produits ?
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate('/gagner')}>
              Devenir ambassadeur <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
