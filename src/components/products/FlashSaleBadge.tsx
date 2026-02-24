import { useCountdown } from '@/hooks/useCountdown';
import { Flame } from 'lucide-react';

interface FlashSaleBadgeProps {
  saleEndsAt: string | null | undefined;
  salePrice?: number | null;
  originalPrice?: number | null;
  className?: string;
}

export function FlashSaleBadge({ saleEndsAt, salePrice, originalPrice, className = '' }: FlashSaleBadgeProps) {
  const countdown = useCountdown(saleEndsAt);

  if (!countdown.active || !saleEndsAt) return null;

  const discountPct = salePrice != null && originalPrice && originalPrice > 0
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : null;

  return (
    <div className={`flex items-center gap-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full animate-pulse ${className}`}>
      <Flame className="h-3 w-3" />
      <span>
        {discountPct != null && `-${discountPct}% · `}
        {countdown.label}
      </span>
    </div>
  );
}
