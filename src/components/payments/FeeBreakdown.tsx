import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { computeFeeBreakdown, type FeeBreakdownInput } from '@/lib/fees';

interface FeeBreakdownProps extends Omit<FeeBreakdownInput, 'locale'> {
  className?: string;
  /** Compact single-line variant for cards and checkout footers */
  variant?: 'card' | 'inline';
  title?: string;
}

/**
 * Canonical fee transparency block: buyer pays → SiteViral fee → (ambassador)
 * → you receive. Same numbers everywhere: checkout, product forms, receipts.
 */
export function FeeBreakdown({ className, variant = 'card', title, ...input }: FeeBreakdownProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const result = computeFeeBreakdown({ ...input, locale });

  if (variant === 'inline') {
    return (
      <p className={cn('flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground', className)}>
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          {result.summary}
          {result.buyerPays > 0 && (
            <>
              {' '}
              <span className="font-medium text-foreground">
                {isFr ? 'Vous recevez' : 'You receive'} {formatCurrency(result.youReceive, result.currency, locale)}
              </span>
            </>
          )}
        </span>
      </p>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xs',
        className,
      )}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title ?? (isFr ? 'Transparence des frais' : 'Fee transparency')}
      </p>

      <ul className="space-y-2.5">
        {result.lines.map((line) => (
          <li key={line.key} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('text-sm', line.emphasis ? 'font-semibold text-foreground' : 'text-foreground/90')}>
                {line.label}
              </p>
              {line.note && <p className="text-[11px] leading-snug text-muted-foreground">{line.note}</p>}
            </div>
            <span
              className={cn(
                'shrink-0 tabular-nums text-sm',
                line.emphasis ? 'font-bold text-primary' : 'text-foreground/80',
              )}
            >
              {line.amount < 0 ? '−' : ''}
              {formatCurrency(Math.abs(line.amount), result.currency, locale)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-border/50 pt-3 text-[11px] leading-snug text-muted-foreground">
        {result.summary}
      </p>
    </div>
  );
}

/**
 * Buyer-side transparency line: the displayed price is the final price.
 * Never shows the seller's fee split — buyers don't pay it.
 */
export function BuyerFeeNote({ className }: { className?: string }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  return (
    <p className={cn('flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground', className)}>
      <Info className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        {isFr
          ? 'Prix final — aucun frais ajouté au paiement. Accès immédiat après confirmation.'
          : 'Final price — no fee added at checkout. Instant access once confirmed.'}
      </span>
    </p>
  );
}
