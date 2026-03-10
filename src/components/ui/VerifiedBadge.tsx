import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  showTooltip?: boolean;
  animate?: boolean;
}

const sizePx = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * SiteViral branded verification badge.
 * Unique starburst rosette with a checkmark, plus a periodic shimmer shine.
 */
export function VerifiedBadge({
  size = 'sm',
  label,
  className,
  showTooltip = true,
  animate = true,
}: VerifiedBadgeProps) {
  const tooltipText = label || 'Compte vérifié';
  const s = sizePx[size];
  const uid = `sv-${size}`;

  const icon = (
    <span
      className={cn(
        'inline-flex items-center shrink-0 relative overflow-hidden',
        animate && 'sv-badge-shimmer',
        className,
      )}
      style={{ width: s, height: s, borderRadius: '50%' }}
    >
      <svg
        viewBox="0 0 24 24"
        width={s}
        height={s}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block relative z-[1]"
      >
        <defs>
          <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" />
          </linearGradient>
        </defs>

        {/* 12-point starburst rosette */}
        <path
          d="M12 0 L13.8 3.6 L17.2 1.6 L17.2 5.4 L21 5.2 L19.4 8.8 L23 10
             L20.2 12 L23 14 L19.4 15.2 L21 18.8 L17.2 18.6 L17.2 22.4
             L13.8 20.4 L12 24 L10.2 20.4 L6.8 22.4 L6.8 18.6 L3 18.8
             L4.6 15.2 L1 14 L3.8 12 L1 10 L4.6 8.8 L3 5.2 L6.8 5.4
             L6.8 1.6 L10.2 3.6 Z"
          fill={`url(#${uid}-g)`}
        />

        {/* Checkmark */}
        <path
          d="M8.5 12.5 L11 15 L16 9.5"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );

  if (!showTooltip) return icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{icon}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs font-medium bg-primary text-primary-foreground border-0"
        >
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
