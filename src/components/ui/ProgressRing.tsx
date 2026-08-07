/**
 * Thin circular progress ring used on course catalog cards.
 */
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  size?: number;
  className?: string;
}

export function ProgressRing({ value, size = 36, className }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${clamped}%`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold">
        {clamped}%
      </span>
    </div>
  );
}
