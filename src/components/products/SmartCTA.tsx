import { ShoppingBag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { useExperimentContent, useExperimentClick } from '@/hooks/useExperimentContent';
import { useI18n } from '@/i18n/I18nContext';

interface SmartCTAProps {
  product: any;
  isPurchased: boolean;
  onBuy: () => void;
  onAccess?: () => void;
  className?: string;
}

export function SmartCTA({ product, isPurchased, onBuy, onAccess, className }: SmartCTAProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const salesCount = product?.sales_count || 0;

  if (isPurchased) {
    return (
      <div className={cn('space-y-2', className)}>
        <Button
          size="lg"
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg"
          onClick={onAccess}
        >
          <ShoppingBag className="h-4 w-4" />
          {isFr ? 'Accéder au contenu' : 'Access content'}
        </Button>
        <p className="text-center text-xs text-emerald-600 font-medium">✓ {isFr ? 'Déjà acheté' : 'Already purchased'}</p>
      </div>
    );
  }

  const isPwyw = !!(product as any)?.is_pwyw;
  const isFree = !isPwyw && !!product?.is_free;
  const hasSale = !isPwyw && !isFree && product?.sale_price && product?.sale_price < product?.price;
  const displayPrice = hasSale ? product.sale_price : product.price;
  const currency = product?.currency || 'XOF';
  const minPrice = (product as any)?.min_price || 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Simple social proof — one line, no rotation */}
      {salesCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary font-medium">
            {isFr ? `${salesCount}+ acheteurs` : `${salesCount}+ buyers`}
          </span>
        </div>
      )}

      {/* Main CTA */}
      <ProductCTAButton
        isPwyw={isPwyw}
        isFree={isFree}
        minPrice={minPrice}
        displayPrice={displayPrice}
        currency={currency}
        onBuy={onBuy}
      />

      {/* Strikethrough original price */}
      {hasSale && (
        <p className="text-center text-xs text-muted-foreground">
          <span className="line-through">{formatPrice(product.price, false, currency)}</span>
          <span className="ml-2 text-destructive font-semibold">
            -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
          </span>
        </p>
      )}
    </div>
  );
}

/** Sub-component that uses experiment hook at top level (no conditional) */
function ProductCTAButton({
  isPwyw, isFree, minPrice, displayPrice, currency, onBuy,
}: {
  isPwyw: boolean; isFree: boolean; minPrice: number; displayPrice: number; currency: string; onBuy: () => void;
}) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const defaultLabel = isPwyw
    ? `💰 ${isFr ? 'Prix libre' : 'Name your price'}${minPrice > 0 ? ` · ${formatPrice(minPrice, false, currency)}+` : ''}`
    : isFree
      ? (isFr ? 'Obtenir gratuitement' : 'Get for free')
      : `${isFr ? 'Acheter' : 'Buy'} — ${formatPrice(displayPrice, false, currency)}`;

  const ctaExperiment = useExperimentContent('cta', defaultLabel);
  const trackClick = useExperimentClick();

  return (
    <Button
      size="lg"
      className="w-full gap-2 font-semibold shadow-lg text-base h-12"
      onClick={() => {
        trackClick(ctaExperiment);
        onBuy();
      }}
    >
      <ShoppingBag className="h-5 w-5" />
      {ctaExperiment.value}
    </Button>
  );
}
