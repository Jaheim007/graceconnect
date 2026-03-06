import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SmartEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  emoji?: string;
  accentColor?: string;
  className?: string;
}

export function SmartEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  emoji = '✨',
  accentColor = 'text-primary',
  className,
}: SmartEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('text-center py-10 px-6', className)}
    >
      <div className="relative inline-flex mb-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className={cn('h-7 w-7', accentColor)} />
        </div>
        <span className="absolute -top-2 -right-2 text-xl">{emoji}</span>
      </div>

      <h3 className="text-base font-bold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col gap-2 items-center">
        <Button size="sm" className="gap-2 min-w-[180px]" onClick={onAction}>
          {actionLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button size="sm" variant="ghost" className="text-xs" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
