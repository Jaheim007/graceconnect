import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/products/ProductCard';
import { MediaCard } from '@/components/media/MediaCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BookOpen, Loader2, Heart, HandHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Link } from '@/lib/router-compat';
import { Badge } from '@/components/ui/badge';
import { diversifyFeed } from '@/lib/feed-diversity';
import { OfferingCard } from '@/components/offerings/OfferingCard';
import { OfferingModal } from '@/components/offerings/OfferingModal';
import { Offering } from '@/hooks/useOfferings';

import { CategoryRail, type CategoryValue } from '@/components/discover/CategoryRail';

interface CategoryCarouselsProps {
  /** Controlled category (rail rendered elsewhere, e.g. in the page header). */
  category?: CategoryValue;
  onCategoryChange?: (v: CategoryValue) => void;
  /** Hide the built-in rail when the page owns it. */
  hideRail?: boolean;
}

export function CategoryCarousels({ category, onCategoryChange, hideRail }: CategoryCarouselsProps = {}) {
  const [internalCategory, setInternalCategory] = useState<CategoryValue>('');
  const activeCategory = category ?? internalCategory;
  const setActiveCategory = onCategoryChange ?? setInternalCategory;
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  


  const isCourseCategory = activeCategory === 'course';
  const isCampaignCategory = activeCategory === 'campaigns';
  const isOfferingCategory = activeCategory === 'offerings';
  const isVideoCategory = activeCategory === 'video';
  const isSpecialCategory = isCampaignCategory || isOfferingCategory || isVideoCategory;

  // Video lives in media_content (video + reel), not in digital_products.
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['category-carousel-videos'],
    queryFn: async () => {
      const { data } = await db
        .from('media_content')
        .select('*')
        .eq('is_published', true)
        .in('media_type', ['video', 'reel'])
        .order('created_at', { ascending: false })
        .limit(24);
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: isVideoCategory,
  });

  // Products / programs query
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['category-carousel', activeCategory],
    queryFn: async () => {
      if (isCourseCategory) {
        const { data } = await db
          .from('programs')
          .select('*, organizations(name, slug, logo_url, currency, is_verified)')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(24);
        return (data || []).map((p: any) => ({
          ...p,
          _isProgram: true,
          organization_name: p.organizations?.name,
          organization_slug: p.organizations?.slug,
          organization_logo: p.organizations?.logo_url,
          is_org_verified: p.organizations?.is_verified,
        }));
      }

      let q = db
        .from('digital_products')
        .select('*, organizations(name, slug, logo_url, currency, is_verified)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeCategory && !isSpecialCategory) {
        q = q.eq('product_type', activeCategory);
      }

      const { data } = await q;
      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name,
        organization_slug: p.organizations?.slug,
        organization_logo: p.organizations?.logo_url,
        is_org_verified: p.organizations?.is_verified,
      }));
    },
    staleTime: 2 * 60 * 1000,
    enabled: !isSpecialCategory,
  });

  // Campaigns query
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['category-carousel-campaigns'],
    queryFn: async () => {
      const { data } = await db
        .from('donation_campaigns')
        .select('*, organizations(name, slug, logo_url, currency, is_verified, kyc_status, category)')
        .eq('is_published', true)
        .eq('is_active', true)
        .eq('is_express_demo', false)
        .order('current_amount', { ascending: false })
        .limit(24);
      return (data || []).map((c: any) => ({
        ...c,
        organization_name: c.organizations?.name,
        organization_slug: c.organizations?.slug,
        is_org_verified: c.organizations?.is_verified,
        org_kyc_status: c.organizations?.kyc_status,
        org_category: c.organizations?.category,
      }));
    },
    staleTime: 2 * 60 * 1000,
    enabled: isCampaignCategory,
  });

  // Offerings query
  const { data: offerings = [], isLoading: loadingOfferings } = useQuery({
    queryKey: ['category-carousel-offerings'],
    queryFn: async () => {
      const { data } = await db
        .from('offerings')
        .select('*, organizations!inner(name, slug, logo_url, currency, offerings_enabled, is_verified, kyc_status, category)')
        .eq('is_active', true)
        .eq('organizations.offerings_enabled', true)
        .order('created_at', { ascending: false })
        .limit(24);
      return (data || []).map((o: any) => ({
        ...o,
        organization_name: o.organizations?.name,
        organization_slug: o.organizations?.slug,
        is_org_verified: o.organizations?.is_verified,
        org_kyc_status: o.organizations?.kyc_status,
        org_category: o.organizations?.category,
      }));
    },
    staleTime: 2 * 60 * 1000,
    enabled: isOfferingCategory,
  });

  const diverseProducts = useMemo(() => {
    if (isCourseCategory || isSpecialCategory) return products;
    return diversifyFeed(products).slice(0, 12);
  }, [products, isCourseCategory, isSpecialCategory]);

  const isLoading = isVideoCategory
    ? loadingVideos
    : isSpecialCategory
      ? (isCampaignCategory ? loadingCampaigns : loadingOfferings)
      : loadingProducts;

  const currentItems = isVideoCategory
    ? videos
    : isCampaignCategory ? campaigns : isOfferingCategory ? offerings : diverseProducts;

  return (
    <div className="space-y-4 py-4">
      {/* Category rail — hidden when the page renders it in its header */}
      {!hideRail && <CategoryRail value={activeCategory} onChange={setActiveCategory} />}



      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : currentItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          {isFr ? 'Aucun contenu dans cette catégorie' : 'No content in this category'}
        </p>
      ) : isVideoCategory ? (
        /* Video & reels grid — from the media library */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-1">
          {videos.map((m: any, i: number) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i, 8) * 0.03 }}
            >
              <MediaCard media={m} />
            </motion.div>
          ))}
        </div>
      ) : isCampaignCategory ? (
        /* Campaigns grid */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-1">
          {campaigns.map((c: any, i: number) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <CampaignCard campaign={c} />
            </motion.div>
          ))}
        </div>
      ) : isOfferingCategory ? (
        /* Offerings grid */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-1">
          {offerings.map((o: any, i: number) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <OfferingCard offering={o} onSelect={setSelectedOffering} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Products / programs carousel */
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 px-1">
            {diverseProducts.map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="shrink-0 w-[220px] sm:w-[260px]"
              >
                {p._isProgram ? (
                  <Link
                    to={`/program/${p.id}`}
                    className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-video bg-muted">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <BookOpen className="h-8 w-8 text-primary/30" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 text-[10px] bg-primary/90 text-primary-foreground">
                        <BookOpen className="h-2.5 w-2.5 mr-1" />
                        {isFr ? 'Formation' : 'Course'}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{p.title}</p>
                      {p.organization_name && (
                        <p className="text-[10px] text-muted-foreground">{p.organization_name}</p>
                      )}
                      <p className="text-[10px] text-primary font-medium">{isFr ? 'Gratuit • S\'inscrire' : 'Free • Enroll'}</p>
                    </div>
                  </Link>
                ) : (
                  <ProductCard product={p} hideCommission hideShare />
                )}
              </motion.div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {selectedOffering && (
        <OfferingModal
          offering={selectedOffering}
          organizationId={selectedOffering.organization_id}
          open={!!selectedOffering}
          onClose={() => setSelectedOffering(null)}
        />
      )}
    </div>
  );
}
