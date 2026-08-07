import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/products/ProductCard';
import { CampaignCard } from '@/components/donations/CampaignCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BookOpen, Loader2, Heart, HandHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { diversifyFeed } from '@/lib/feed-diversity';
import { OfferingCard } from '@/components/offerings/OfferingCard';
import { OfferingModal } from '@/components/offerings/OfferingModal';
import { Offering } from '@/hooks/useOfferings';

const CATEGORY_META = [
  { value: '', emoji: '' },
  { value: 'pdf', emoji: '📄' },
  { value: 'ebook', emoji: '📚' },
  { value: 'audio', emoji: '🎵' },
  { value: 'video', emoji: '🎬' },
  { value: 'course', emoji: '🎓' },
  { value: 'link', emoji: '🔗' },
  { value: 'campaigns', emoji: '❤️' },
  { value: 'offerings', emoji: '🤲' },
] as const;

type CategoryValue = typeof CATEGORY_META[number]['value'];

export function CategoryCarousels() {
  const [activeCategory, setActiveCategory] = useState<CategoryValue>('');
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const labels: Record<string, string> = {
    '': isFr ? 'Tout' : 'All',
    pdf: 'PDF',
    ebook: 'E-books',
    audio: isFr ? 'Audio' : 'Audio',
    video: isFr ? 'Vidéo' : 'Video',
    course: isFr ? 'Cours' : 'Courses',
    link: isFr ? 'Liens' : 'Links',
    campaigns: isFr ? 'Campagnes' : 'Campaigns',
    offerings: isFr ? 'Dons' : 'Donations',
  };

  const isCourseCategory = activeCategory === 'course';
  const isCampaignCategory = activeCategory === 'campaigns';
  const isOfferingCategory = activeCategory === 'offerings';
  const isSpecialCategory = isCampaignCategory || isOfferingCategory;

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
          .limit(12);
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
        .limit(12);
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
        .limit(12);
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

  const isLoading = isSpecialCategory
    ? (isCampaignCategory ? loadingCampaigns : loadingOfferings)
    : loadingProducts;

  const currentItems = isCampaignCategory ? campaigns : isOfferingCategory ? offerings : diverseProducts;

  return (
    <div className="space-y-4 py-4">
      {/* Category pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2 px-1">
          {CATEGORY_META.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border',
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {cat.emoji} {labels[cat.value]}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : currentItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          {isFr ? 'Aucun contenu dans cette catégorie' : 'No content in this category'}
        </p>
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
