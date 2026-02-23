import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, Filter, ShoppingBag, Heart, Users, CheckCircle2 } from 'lucide-react';
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
  { value: 'church', label: 'Organisation' },
  { value: 'ministry', label: 'Association' },
  { value: 'leader', label: 'Leader' },
  { value: 'ngo', label: 'ONG' },
  { value: 'community', label: 'Communauté' },
  { value: 'other', label: 'Autre' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<OrgCategory | ''>('');
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState('products');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const { data: directoryMode = 'curated' } = useDirectoryMode();

  const { data, isLoading } = usePublicOrgs({ search, category, page });
  const orgs = data?.orgs || [];
  const total = data?.total || 0;
  const pageSize = 12;

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

  const filteredOrgs = directoryMode === 'curated'
    ? orgs.filter((o: any) => o.is_verified || o.is_featured)
    : orgs;

  const verifiedOrgs = filteredOrgs.filter((o: any) => o.is_verified);

  return (
    <div className="bg-background min-h-screen">
      <SEOHead title="Explorer — Communautés, Produits & Campagnes" description="Découvrez les meilleures communautés, produits numériques et campagnes de collecte sur Siteviral." />
      <div className="border-b border-border py-6 px-4">
        <div className="container max-w-4xl">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Explorer</h1>
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
            <TabsTrigger value="products" className="gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> Produits
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Campagnes
            </TabsTrigger>
          </TabsList>


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
