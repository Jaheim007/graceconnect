import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpTipProps {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

/**
 * Contextual help tooltip — wraps any element or shows a small "?" icon.
 * Used throughout admin panels to explain *benefits* not just features.
 */
export function HelpTip({ content, side = 'top', className, iconClassName, children }: HelpTipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button type="button" className={cn('inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted/60 hover:bg-muted transition-colors shrink-0', className)}>
              <HelpCircle className={cn('h-3 w-3 text-muted-foreground', iconClassName)} />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[240px] text-xs leading-relaxed">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
