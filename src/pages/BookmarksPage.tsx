import { Bookmark, ArrowLeft, Heart, ShoppingBag, Calendar, Megaphone, Film, Trash2 } from 'lucide-react';
import { useBookmarks, useToggleBookmark, type BookmarkContentType } from '@/hooks/useBookmarks';
import { useWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { formatPrice, getProductPriceLabel } from '@/lib/currency';

const CONTENT_ICONS: Record<string, any> = {
  product: ShoppingBag,
  media: Film,
  event: Calendar,
  announcement: Megaphone,
  campaign: Megaphone,
};

export default function BookmarksPage() {
  const { data: bookmarks = [], isLoading: loadingBookmarks } = useBookmarks();
  const { data: wishlistItems = [], isLoading: loadingWishlist } = useWishlist();
  const toggleBookmark = useToggleBookmark();
  const toggleWishlist = useToggleWishlist();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const isFr = locale === 'fr';

  const isLoading = loadingBookmarks || loadingWishlist;
  const hasItems = wishlistItems.length > 0 || bookmarks.length > 0;

  const dateFmt = (d: string) =>
    new Date(d).toLocaleDateString(isFr ? 'fr-FR' : locale === 'ar' ? 'ar' : 'en-US', {
      day: 'numeric', month: 'short',
    });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t('bookmarks.title')}
        description={
          locale === 'fr'
            ? 'Retrouvez les produits numériques, formations, événements et pages que vous avez enregistrés sur SiteViral.'
            : 'Find the digital products, courses, events and pages you saved on SiteViral.'
        }
        noindex
      />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Heart className="h-4 w-4 text-primary fill-primary" />
        <span className="font-semibold text-sm flex-1">{t('bookmarks.title')}</span>
        {hasItems && (
          <span className="text-xs text-muted-foreground">
            {wishlistItems.length + bookmarks.length}
          </span>
        )}
      </div>

      <main id="main-content" className="container max-w-2xl py-5 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasItems ? (
          <EmptyState
            variant="generic"
            title={t('bookmarks.empty')}
            description={t('bookmarks.empty_desc')}
            action={{
              label: isFr ? 'Explorer' : 'Explore',
              onClick: () => navigate('/discover'),
            }}
          />
        ) : (
          <>
            {/* Wishlisted products */}
            {wishlistItems.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {isFr ? 'Produits sauvegardés' : 'Saved products'} ({wishlistItems.length})
                </h2>
                <div className="space-y-2">
                  {wishlistItems.map((item: any) => {
                    const product = item.digital_products;
                    if (!product) return null;
                    const org = product.organizations;
                    const slug = product.slug
                      ? `/org/${org?.slug}/p/${product.slug}`
                      : `/org/${org?.slug}/product/${product.id}`;

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(slug)}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="h-16 w-16 rounded-xl bg-muted/50 overflow-hidden shrink-0">
                          {product.cover_image_url ? (
                            <img src={product.cover_image_url} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-semibold line-clamp-1">{product.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {org?.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const label = getProductPriceLabel(product as any, locale);
                              return (
                                <span className={cn('text-xs font-bold', label.isFree ? 'text-emerald-500' : label.isPwyw ? 'text-amber-600' : 'text-primary')}>
                                  {label.text}
                                </span>
                              );
                            })()}
                            <span className="text-[10px] text-muted-foreground">
                              {dateFmt(item.created_at)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist.mutate({ productId: product.id, isCurrentlyWishlisted: true });
                          }}
                          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={isFr ? 'Retirer' : 'Remove'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Other bookmarks (events, media, announcements) */}
            {bookmarks.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {isFr ? 'Autres favoris' : 'Other bookmarks'} ({bookmarks.length})
                </h2>
                <div className="space-y-2">
                  {bookmarks.map((b: any) => {
                    const Icon = CONTENT_ICONS[b.content_type] || Bookmark;
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">{b.content_type}</p>
                          <p className="text-[10px] text-muted-foreground">{dateFmt(b.created_at)}</p>
                        </div>
                        <button
                          onClick={() => toggleBookmark.mutate({ contentType: b.content_type as BookmarkContentType, contentId: b.content_id })}
                          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={isFr ? 'Retirer' : 'Remove'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
