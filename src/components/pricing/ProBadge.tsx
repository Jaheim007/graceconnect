import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface ProBadgeProps {
  className?: string;
  variant?: 'default' | 'subtle';
  label?: string;
}

/**
 * Non-blocking Pro indicator. Used to mark features that will require
 * the Pro plan once billing is enabled. During rollout the feature still
 * works — the badge just signals future scope.
 */
export function ProBadge({ className, variant = 'default', label }: ProBadgeProps) {
  const { locale } = useI18n();
  const text = label || (locale === 'fr' ? 'Pro bientôt' : 'Pro soon');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        variant === 'default'
          ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
          : 'bg-muted text-muted-foreground border border-border',
        className,
      )}
    >
      <Crown className="h-3 w-3" />
      {text}
    </span>
  );
}
