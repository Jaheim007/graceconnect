import { CheckCircle2 } from 'lucide-react';
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
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function VerifiedBadge({ size = 'sm', label, className, showTooltip = true }: VerifiedBadgeProps) {
  const tooltipText = label || 'Compte vérifié';

  const icon = (
    <span className={cn('inline-flex items-center shrink-0', className)}>
      <CheckCircle2
        className={cn(
          sizeClasses[size],
          'text-[hsl(var(--primary))] drop-shadow-[0_0_3px_hsl(var(--primary)/0.4)]'
        )}
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth={2.5}
      />
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
