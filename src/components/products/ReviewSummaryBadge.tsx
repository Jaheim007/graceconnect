import { Star } from 'lucide-react';
import { useProductReviews } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  className?: string;
}

export function ReviewSummaryBadge({ productId, className }: Props) {
  const { data: reviews = [] } = useProductReviews(productId);

  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const verifiedCount = reviews.filter(r => r.is_verified_purchase).length;

  return (
    <div className={cn('p-4 rounded-xl border border-border bg-card/50 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold">{avg.toFixed(1)}</p>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  avg >= i ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{reviews.length} avis</p>
          {verifiedCount > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {verifiedCount} achat{verifiedCount > 1 ? 's' : ''} vérifié{verifiedCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Mini distribution */}
      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map(star => {
          const count = reviews.filter(r => r.rating === star).length;
          const pct = (count / reviews.length) * 100;
          return (
            <div key={star} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 text-muted-foreground">{star}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
