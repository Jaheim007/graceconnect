/**
 * Shared fee transparency helper.
 *
 * SiteViral charges ONE all-inclusive fee on sales (default 10%). That fee
 * already covers the payment processor (Mobile Money, Wave, card), hosting and
 * delivery — there is never a second fee added on top, and the buyer never pays
 * more than the displayed price.
 *
 * Church / NGO offerings (donations, tithes, giving) are 0% — SiteViral takes
 * no margin on generosity.
 */

export const DEFAULT_PLATFORM_FEE_PERCENT = 10;

export type FeeContext = 'sale' | 'offering';

export interface FeeBreakdownLine {
  /** Stable key for tests / analytics */
  key: 'buyer_pays' | 'platform_fee' | 'affiliate' | 'you_receive';
  label: string;
  amount: number;
  /** Rendered as a muted note under the line */
  note?: string;
  emphasis?: boolean;
}

export interface FeeBreakdownResult {
  currency: string;
  buyerPays: number;
  platformFee: number;
  platformFeePercent: number;
  affiliateCommission: number;
  affiliateCommissionPercent: number;
  youReceive: number;
  lines: FeeBreakdownLine[];
  /** One-line reassurance shown to buyers and sellers */
  summary: string;
}

export interface FeeBreakdownInput {
  amount: number;
  currency: string;
  /** Org fee percent (falls back to 10). Ignored for offerings. */
  platformFeePercent?: number | null;
  /** Commission paid to an ambassador when the sale comes from a referral */
  affiliateCommissionPercent?: number | null;
  includeAffiliate?: boolean;
  context?: FeeContext;
  locale?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compute the canonical 4-line fee breakdown used on checkout, product forms,
 * receipts and payout screens. Same math as `process-transaction.ts`.
 */
export function computeFeeBreakdown(input: FeeBreakdownInput): FeeBreakdownResult {
  const isFr = (input.locale ?? 'fr').startsWith('fr');
  const context: FeeContext = input.context ?? 'sale';
  const amount = Math.max(0, Number(input.amount) || 0);

  const feePercent = context === 'offering'
    ? 0
    : Math.max(0, input.platformFeePercent ?? DEFAULT_PLATFORM_FEE_PERCENT);

  const affiliatePercent = input.includeAffiliate
    ? Math.max(0, input.affiliateCommissionPercent ?? 0)
    : 0;

  const platformFee = round2(amount * feePercent / 100);
  const affiliateCommission = round2(amount * affiliatePercent / 100);
  const youReceive = round2(Math.max(0, amount - platformFee - affiliateCommission));

  const lines: FeeBreakdownLine[] = [
    {
      key: 'buyer_pays',
      label: context === 'offering'
        ? (isFr ? 'Le donateur donne' : 'Donor gives')
        : (isFr ? "L'acheteur paie" : 'Buyer pays'),
      amount,
      note: isFr ? 'Aucun frais ajouté au moment du paiement.' : 'No fee added at payment time.',
    },
    {
      key: 'platform_fee',
      label: isFr
        ? `Frais SiteViral (${feePercent}% tout compris)`
        : `SiteViral fee (${feePercent}% all-inclusive)`,
      amount: -platformFee,
      note: feePercent === 0
        ? (isFr ? 'Offrandes et dons : 0% de marge.' : 'Offerings and donations: 0% margin.')
        : (isFr
          ? 'Inclut Mobile Money / Wave / carte, hébergement et livraison.'
          : 'Includes Mobile Money / Wave / card, hosting and delivery.'),
    },
  ];

  if (affiliatePercent > 0) {
    lines.push({
      key: 'affiliate',
      label: isFr
        ? `Commission ambassadeur (${affiliatePercent}%)`
        : `Ambassador commission (${affiliatePercent}%)`,
      amount: -affiliateCommission,
      note: isFr ? 'Payée uniquement sur les ventes référées.' : 'Paid only on referred sales.',
    });
  }

  lines.push({
    key: 'you_receive',
    label: context === 'offering'
      ? (isFr ? 'Votre organisation reçoit' : 'Your organization receives')
      : (isFr ? 'Vous recevez' : 'You receive'),
    amount: youReceive,
    emphasis: true,
  });

  const summary = feePercent === 0
    ? (isFr
      ? '0% de frais SiteViral sur les dons et offrandes.'
      : '0% SiteViral fee on donations and offerings.')
    : (isFr
      ? `Un seul frais de ${feePercent}%, frais de paiement inclus. Pas de frais caché, pas d'abonnement.`
      : `One single ${feePercent}% fee, payment fees included. No hidden fee, no subscription.`);

  return {
    currency: input.currency,
    buyerPays: amount,
    platformFee,
    platformFeePercent: feePercent,
    affiliateCommission,
    affiliateCommissionPercent: affiliatePercent,
    youReceive,
    lines,
    summary,
  };
}
