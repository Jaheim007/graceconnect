import { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Star } from 'lucide-react';
import { SellerTrustBadges } from '@/components/products/SellerTrustBadges';
import { AmbassadorBanner } from '@/components/products/AmbassadorBanner';
import { MarketingKit } from '@/components/ambassador/MarketingKit';
import { ProductTableOfContents } from '@/components/products/ProductTableOfContents';
import { ReviewSummaryBadge } from '@/components/products/ReviewSummaryBadge';
import { ShareToEarnCTA } from '@/components/products/ShareToEarnCTA';
import { BecomeAmbassadorCTA } from '@/components/products/BecomeAmbassadorCTA';
import { CreateSimilarCTA } from '@/components/products/CreateSimilarCTA';
import { getEffectivePrice } from '@/lib/effectivePrice';

interface ProductSidebarExtrasProps {
  product: any;
  org: any;
  slug: string;
  isPurchased: boolean;
  locale: string;
  orgPrimary?: string | null;
  buildShareUrl: () => string;
}

export const ProductSidebarExtras = memo(function ProductSidebarExtras({
  product,
  org,
  slug,
  isPurchased,
  locale,
  orgPrimary,
  buildShareUrl,
}: ProductSidebarExtrasProps) {
  const isFr = locale === 'fr';

  return (
    <>
      {/* Trust indicators */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Shield className="h-4 w-4" style={{ color: orgPrimary || 'hsl(var(--primary))' }} />, label: isFr ? 'Paiement sécurisé' : 'Secure payment' },
          { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, label: isFr ? 'Accès immédiat' : 'Instant access' },
          { icon: <Star className="h-4 w-4 text-yellow-500" />, label: isFr ? 'Qualité garantie' : 'Quality guaranteed' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border/60 bg-muted/30 text-center"
          >
            {item.icon}
            <span className="text-[10px] font-medium text-muted-foreground leading-tight">{item.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Ambassador Banner */}
      {!isPurchased && org && slug && (
        <AmbassadorBanner orgSlug={slug} orgName={org.name} />
      )}

      {/* Marketing Kit */}
      <MarketingKit
        productTitle={product.title}
        productPrice={getEffectivePrice(product)}
        productCurrency={product.currency || 'XOF'}
        commissionPercent={product.commission_percent || 10}
        shareUrl={buildShareUrl()}
        orgName={org?.name || ''}
      />

      {/* Table of Contents */}
      {product.description && (
        <ProductTableOfContents descriptionHtml={product.description} />
      )}

      {/* Review Summary */}
      <ReviewSummaryBadge productId={product.id} />

      {/* Seller Trust */}
      <SellerTrustBadges
        organizationId={product.organization_id}
        orgName={org?.name || ''}
        kycStatus={org?.kyc_status}
      />

      {/* Share & Earn CTA */}
      <ShareToEarnCTA
        productId={product.id}
        organizationId={product.organization_id}
        organizationSlug={slug || ''}
        productSlug={product.slug}
        commissionPercent={product.commission_percent}
      />

      {/* Become Ambassador CTA */}
      <BecomeAmbassadorCTA
        organizationId={product.organization_id}
        orgSlug={slug || ''}
        orgName={org?.name || ''}
        commissionPercent={product.commission_percent}
      />

      {/* Create similar */}
      <CreateSimilarCTA
        productType={product.product_type || undefined}
        productTitle={product.title}
      />
    </>
  );
});
