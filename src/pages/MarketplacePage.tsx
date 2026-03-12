import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Search, SlidersHorizontal, Star, TrendingUp, Sparkles, Store, ArrowRight, ShoppingBag, BookOpen, Headphones, Video, GraduationCap, FileText, Heart, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
};

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const isFr = locale === 'fr';

  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  const [typeFilter, setTypeFilter] = useState(tabParam === 'campaigns' ? 'campaigns' : '');
  const [langFilter, setLangFilter] = useState('');

  const isPublic = !user;
  const isAmbassador = !!user;

  useEffect(() => {
    if (!isAmbassador && sortBy === 'commission') {
      setSortBy('popular');
    }
  }, [isAmbassador, sortBy]);

  const categoryFilters = [
    { key: '', label: isFr ? 'Tout' : 'All', icon: ShoppingBag },
    { key: 'campaigns', label: isFr ? 'Campagnes' : 'Campaigns', icon: Heart },
    { key: 'pdf', label: 'PDF', icon: FileText },
    { key: 'ebook', label: 'eBook', icon: BookOpen },
    { key: 'video', label: isFr ? 'Vidéo' : 'Video', icon: Video },
    { key: 'course', label: isFr ? 'Cours' : 'Course', icon: GraduationCap },
    { key: 'audio', label: 'Audio', icon: Headphones },
  ];

  const langFilters = [
    { key: '', label: isFr ? 'Toutes langues' : 'All languages', flag: '🌍' },
    { key: 'fr', label: 'Français', flag: '🇫🇷' },
    { key: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['marketplace-products', search, sortBy, typeFilter, langFilter],
    queryFn: async () => {
      const orderCol = sortBy === 'commission' ? 'price' : sortBy === 'newest' ? 'created_at' : sortBy === 'bestseller' ? 'sales_count' : 'sales_count';
      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, affiliation_commission_percent, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order(orderCol, { ascending: false })
        .limit(60);
      if (search) q = q.ilike('title', `%${search}%`);
      if (typeFilter && typeFilter !== 'campaigns') q = q.eq('product_type', typeFilter);
      if (langFilter) q = q.eq('content_language', langFilter);
      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        commission_percent: p.organizations?.affiliation_commission_percent,
        is_org_verified: p.organizations?.is_verified,
        org_kyc_status: p.organizations?.kyc_status,
        org_category: p.organizations?.category,
      }));
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['marketplace-campaigns', search],
    queryFn: async () => {
      let q = db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('is_express_demo', false)
        .order('current_amount', { ascending: false })
        .limit(20);
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q;
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
        is_org_verified: c.organizations?.is_verified,
        org_kyc_status: c.organizations?.kyc_status,
        org_category: c.organizations?.category,
      }));
    },
  });

  const sortFilters = isAmbassador
    ? [
        { key: 'commission', label: isFr ? 'Meilleure commission' : 'Best commission', icon: TrendingUp },
        { key: 'newest', label: isFr ? 'Nouveautés' : 'Newest', icon: Sparkles },
        { key: 'bestseller', label: isFr ? 'Top ventes' : 'Best sellers', icon: Star },
      ]
    : [
        { key: 'newest', label: isFr ? 'Nouveautés' : 'Newest', icon: Sparkles },
        { key: 'bestseller', label: isFr ? 'Top ventes' : 'Best sellers', icon: Star },
      ];

  const pageTitle = isAmbassador ? 'Marketplace' : (isFr ? 'Explorer' : 'Explore');

  return (
    <div className="min-h-[80dvh]">
      <SEOHead
        title={`${pageTitle} — ${isFr ? 'Produits numériques' : 'Digital products'} | Siteviral`}
        description={isFr ? 'Explorez les meilleurs produits numériques.' : 'Explore the best digital products.'}
        canonicalUrl="https://siteviral.com/marketplace"
        locale={isFr ? 'fr_FR' : 'en_US'}
      />

      <div className="px-4 pt-5 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">{pageTitle}</h1>
            {isAmbassador && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {isFr ? 'Trouve des produits à partager et gagne des commissions' : 'Find products to share and earn commissions'}
              </p>
            )}
          </div>
          {isAmbassador && (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
              {isFr ? 'Ambassadeur' : 'Ambassador'}
            </Badge>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isFr ? 'Rechercher un produit, un créateur...' : 'Search for a product, a creator...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background transition-colors"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {categoryFilters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? '' : key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0',
                typeFilter === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Language filter chips */}
        <div className="flex gap-1.5 items-center">
          <Globe className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
          {langFilters.map(({ key, label, flag }) => (
            <button
              key={key}
              onClick={() => setLangFilter(langFilter === key ? '' : key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                langFilter === key
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span>{flag}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Sort filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground mr-0.5" />
          {sortFilters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(sortBy === key ? 'popular' : key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                sortBy === key
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {isPublic && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
            <Store className="h-4.5 w-4.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              {isFr ? 'Connectez-vous pour acheter ou accéder à vos ressources.' : 'Sign in to buy or access your resources.'}
            </p>
            <Button size="sm" className="text-xs h-8 shrink-0 rounded-lg" onClick={() => navigate('/auth')}>
              {isFr ? 'Se connecter' : 'Sign in'}
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 space-y-6">
        {typeFilter === 'campaigns' && (
          campaigns.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" /> {isFr ? 'Campagnes actives' : 'Active campaigns'}
              </h2>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {campaigns.map((c: any) => (
                  <motion.div key={c.id} variants={fadeUp} initial="hidden" animate="visible">
                    <CampaignCard campaign={c} />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState variant="search" title={isFr ? 'Aucune campagne active' : 'No active campaigns'} />
          )
        )}

        {typeFilter !== 'campaigns' && (
          <>
            {isLoading ? <SkeletonList count={8} /> : products.length === 0 ? (
              <EmptyState variant="search" title={isFr ? 'Aucun produit trouvé' : 'No products found'} />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
                className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              >
                {products.map((p: any) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <ProductCard
                      product={p}
                      hideCommission={!isAmbassador}
                      hideShare={!isAmbassador}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {campaigns.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <h2 className="font-bold text-sm text-muted-foreground">{isFr ? 'Campagnes de dons' : 'Donation campaigns'}</h2>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                  {campaigns.map((c: any) => (
                    <motion.div key={c.id} variants={fadeUp} initial="hidden" animate="visible">
                      <CampaignCard campaign={c} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {isPublic && (
          <div className="pt-4 border-t border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {isFr ? 'Vous avez du contenu à vendre ? Créez votre espace en quelques minutes.' : 'Have content to sell? Create your space in minutes.'}
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg" onClick={() => navigate('/vendre')}>
              {isFr ? 'En savoir plus' : 'Learn more'} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
