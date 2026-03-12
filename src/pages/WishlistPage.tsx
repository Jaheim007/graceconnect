import { useWishlist } from '@/hooks/useWishlist';
import { useMyPurchases } from '@/hooks/usePurchases';
import { ProductCard } from '@/components/products/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SEOHead } from '@/components/seo/SEOHead';
import { Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n/I18nContext';

export default function WishlistPage() {
  const { data: wishlistItems = [], isLoading } = useWishlist();
  const { data: purchases = [] } = useMyPurchases();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6">
      <SEOHead title={isFr ? "Ma liste d'envies — Siteviral" : "My Wishlist — Siteviral"} noindex />

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{isFr ? "Ma liste d'envies" : 'My Wishlist'}</h1>
          <p className="text-sm text-muted-foreground">
            {wishlistItems.length} {isFr
              ? `produit${wishlistItems.length !== 1 ? 's' : ''} sauvegardé${wishlistItems.length !== 1 ? 's' : ''}`
              : `saved product${wishlistItems.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <EmptyState
          title={isFr ? "Votre liste d'envies est vide" : "Your wishlist is empty"}
          description={isFr ? "Parcourez les produits et cliquez sur le ❤️ pour les sauvegarder ici." : "Browse products and click ❤️ to save them here."}
          action={{ label: isFr ? 'Explorer' : 'Explore', onClick: () => window.location.href = '/discover' }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wishlistItems.map((item: any) => {
            const product = item.digital_products;
            if (!product) return null;
            const org = product.organizations;
            return (
              <ProductCard
                key={item.id}
                product={{
                  ...product,
                  organization_slug: org?.slug || '',
                }}
                isPurchased={purchases.some((p: any) => p.product_id === product.id)}
                hideCommission
                hideShare
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
