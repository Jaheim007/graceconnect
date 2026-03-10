/**
 * Returns the effective selling price of a product, accounting for active sales.
 * This MUST be used everywhere commission/earnings are calculated or displayed.
 *
 * Rules:
 * - If sale_price exists and sale hasn't expired → use sale_price
 * - Otherwise → use regular price
 */
export function getEffectivePrice(product: {
  price?: number | null;
  sale_price?: number | null;
  sale_ends_at?: string | null;
}): number {
  const hasSale =
    product.sale_price != null &&
    product.sale_price > 0 &&
    (!product.sale_ends_at || new Date(product.sale_ends_at) > new Date());

  return hasSale ? product.sale_price! : (product.price || 0);
}

/**
 * Calculates the estimated commission amount for a given product.
 */
export function getEstimatedCommission(product: {
  price?: number | null;
  sale_price?: number | null;
  sale_ends_at?: string | null;
}, commissionPercent: number): number {
  return Math.round(getEffectivePrice(product) * commissionPercent / 100);
}
