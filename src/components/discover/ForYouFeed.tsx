import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/products/ProductCard';
import { Loader2, Sparkles, BookOpen, Video, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

interface FeedItem {
  id: string;
  type: 'product' | 'media' | 'program';
  title: string;
  description?: string;
  image?: string;
  org_name?: string;
  org_slug?: string;
  org_logo?: string;
  price?: number;
  currency?: string;
  is_free?: boolean;
  media_type?: string;
  view_count?: number;
  sales_count?: number;
  created_at: string;
  raw: any;
}

const PAGE_SIZE = 12;

function interleave(products: FeedItem[], media: FeedItem[], programs: FeedItem[]): FeedItem[] {
  const result: FeedItem[] = [];
  let pi = 0, mi = 0, pri = 0;
  while (pi < products.length || mi < media.length || pri < programs.length) {
    for (let i = 0; i < 3 && pi < products.length; i++) result.push(products[pi++]);
    if (mi < media.length) result.push(media[mi++]);
    if (pri < programs.length) result.push(programs[pri++]);
  }
  return result;
}

export function ForYouFeed() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const feedQuery = useInfiniteQuery({
    queryKey: ['for-you-feed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PAGE_SIZE;

      const [productsRes, mediaRes, programsRes] = await Promise.all([
        db.from('digital_products')
          .select('*, organizations(name, slug, logo_url, currency, is_verified)')
          .eq('is_published', true)
          .eq('is_express_demo', false)
          .order('featured_score', { ascending: false })
          .order('sales_count', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1),
        db.from('media_content')
          .select('*, organizations(name, slug, logo_url)')
          .eq('is_published', true)
          .order('view_count', { ascending: false })
          .range(offset, offset + Math.floor(PAGE_SIZE / 3) - 1),
        db.from('programs')
          .select('*, organizations(name, slug, logo_url)')
          .eq('is_published', true)
          .range(offset, offset + Math.floor(PAGE_SIZE / 4) - 1),
      ]);

      const productItems: FeedItem[] = (productsRes.data || []).map((p: any) => ({
        id: p.id, type: 'product', title: p.title,
        description: p.description, image: p.cover_image_url,
        org_name: p.organizations?.name, org_slug: p.organizations?.slug,
        org_logo: p.organizations?.logo_url,
        price: p.price, currency: p.currency || p.organizations?.currency,
        is_free: p.is_free, sales_count: p.sales_count,
        created_at: p.created_at, raw: p,
      }));

      const mediaItems: FeedItem[] = (mediaRes.data || []).map((m: any) => ({
        id: m.id, type: 'media', title: m.title,
        description: m.description, image: m.thumbnail_url,
        org_name: m.organizations?.name, org_slug: m.organizations?.slug,
        org_logo: m.organizations?.logo_url,
        media_type: m.media_type, view_count: m.view_count,
        created_at: m.created_at, raw: m,
      }));

      const programItems: FeedItem[] = (programsRes.data || []).map((p: any) => ({
        id: p.id, type: 'program', title: p.title,
        description: p.description, image: p.cover_image_url,
        org_name: p.organizations?.name, org_slug: p.organizations?.slug,
        org_logo: p.organizations?.logo_url,
        created_at: p.created_at, raw: p,
      }));

      return { items: interleave(productItems, mediaItems, programItems), page: pageParam };
    },
    getNextPageParam: (lastPage) => lastPage.items.length < 5 ? undefined : lastPage.page + 1,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  });

  const items = feedQuery.data?.pages.flatMap(p => p.items) || [];

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !feedQuery.hasNextPage || feedQuery.isFetchingNextPage) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) feedQuery.fetchNextPage();
      }, { rootMargin: '400px' });
      observerRef.current.observe(node);
    },
    [feedQuery.hasNextPage, feedQuery.isFetchingNextPage, feedQuery.fetchNextPage]
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  if (feedQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold">{isFr ? 'Pour vous' : 'For you'}</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, i) => (
          <motion.div key={`${item.type}-${item.id}`} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.02 }}>
            {item.type === 'product' ? (
              <ProductCard product={item.raw} hideCommission hideShare />
            ) : item.type === 'media' ? (
              <MediaFeedCard item={item} isFr={isFr} />
            ) : (
              <ProgramFeedCard item={item} isFr={isFr} />
            )}
          </motion.div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-10" />
      {feedQuery.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function MediaFeedCard({ item, isFr }: { item: FeedItem; isFr: boolean }) {
  return (
    <Link
      to={`/watch/${item.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-video bg-muted">
        {item.image ? (
          <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm text-foreground">
          <Video className="h-2.5 w-2.5 mr-1" />
          {item.media_type || (isFr ? 'vidéo' : 'video')}
        </Badge>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{item.title}</p>
        {item.org_name && (
          <p className="text-[10px] text-muted-foreground">{item.org_name}</p>
        )}
        {item.view_count != null && item.view_count > 0 && (
          <p className="text-[10px] text-muted-foreground">{item.view_count.toLocaleString()} {isFr ? 'vues' : 'views'}</p>
        )}
      </div>
    </Link>
  );
}

function ProgramFeedCard({ item, isFr }: { item: FeedItem; isFr: boolean }) {
  return (
    <Link
      to={`/program/${item.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-video bg-muted">
        {item.image ? (
          <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
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
        <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{item.title}</p>
        {item.org_name && (
          <p className="text-[10px] text-muted-foreground">{item.org_name}</p>
        )}
        <p className="text-[10px] text-primary font-medium">{isFr ? 'Gratuit • S\'inscrire' : 'Free • Enroll'}</p>
      </div>
    </Link>
  );
}
