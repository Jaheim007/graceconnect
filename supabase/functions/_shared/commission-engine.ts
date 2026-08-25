/**
 * Neutral affiliate commission engine.
 *
 * SINGLE SOURCE OF TRUTH for how an ambassador commission is computed,
 * independent of where the money came from:
 *   - native SiteViral sales      → called by _shared/process-transaction.ts
 *   - external platform sales     → called by functions/affiliate-api (Affiliate Cloud)
 *
 * It never touches payment gateways, products or organizations: it only takes
 * an amount, a rate and a link, and returns the commission.
 */

export interface CommissionRate {
  /** Percentage (0-90) applied to the gross amount. */
  percent: number;
}

export interface AffiliateLinkLike {
  id: string;
  user_id: string;
  is_active?: boolean | null;
  is_frozen?: boolean | null;
}

export interface CommissionResult {
  attributed: boolean;
  affiliate_link_id: string | null;
  affiliate_user_id: string | null;
  commission_percent: number;
  commission_amount: number;
  /** Reason the commission is 0 (self-referral, inactive link, no code...). */
  skipped_reason?: string;
}

export function roundMoney(value: number): number {
  return parseFloat(Number(value || 0).toFixed(2));
}

export function clampPercent(percent: number | null | undefined, fallback = 10): number {
  const p = Number(percent ?? fallback);
  if (!Number.isFinite(p) || p < 0) return 0;
  return Math.min(p, 90);
}

export function commissionFromAmount(amount: number, percent: number): number {
  return roundMoney((Number(amount) || 0) * clampPercent(percent) / 100);
}

/**
 * Resolve a commission for a link. `buyerUserId` is used to block self-referral.
 */
export function resolveCommission(params: {
  amount: number;
  percent: number;
  link: AffiliateLinkLike | null | undefined;
  buyerUserId?: string | null;
  enabled?: boolean;
}): CommissionResult {
  const { amount, link, buyerUserId, enabled = true } = params;
  const percent = clampPercent(params.percent);

  const empty = (reason: string): CommissionResult => ({
    attributed: false,
    affiliate_link_id: null,
    affiliate_user_id: null,
    commission_percent: percent,
    commission_amount: 0,
    skipped_reason: reason,
  });

  if (!enabled) return empty('program_disabled');
  if (!link) return empty('no_link');
  if (link.is_active === false) return empty('link_inactive');
  if (link.is_frozen === true) return empty('link_frozen');
  if (buyerUserId && link.user_id === buyerUserId) return empty('self_referral');
  if (!(Number(amount) > 0)) return empty('zero_amount');
  if (percent <= 0) return empty('zero_rate');

  return {
    attributed: true,
    affiliate_link_id: link.id,
    affiliate_user_id: link.user_id,
    commission_percent: percent,
    commission_amount: commissionFromAmount(amount, percent),
  };
}
