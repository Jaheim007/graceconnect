import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Small (i) badge used across the superadmin surface to explain what a
 * metric or section means. Click / hover opens a short legend so
 * operators are never left guessing what a card is for.
 */
export function InfoTooltip({ title, children, className, side = 'top' }: InfoTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="En savoir plus"
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full',
            'text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors',
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="max-w-xs text-xs leading-relaxed">
        {title && <p className="font-semibold mb-1 text-foreground">{title}</p>}
        <div className="text-muted-foreground space-y-1">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Full-width legend banner. Use at the top of a superadmin page to explain
 * what the page shows, key terms, and typical actions.
 */
export function LegendBanner({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Info className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold">{title}</p>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
