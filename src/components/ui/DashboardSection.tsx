import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface DashboardSectionProps {
  title: string;
  icon?: LucideIcon;
  /** Right-side actions */
  actions?: ReactNode;
  /** Make the section collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
  /** Subtitle text */
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable dashboard section with optional collapse.
 * Reduces visual clutter by grouping related content.
 */
export function DashboardSection({
  title, icon: Icon, actions, collapsible, defaultCollapsed = false,
  subtitle, children, className,
}: DashboardSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            {collapsible ? (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors"
              >
                {title}
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', !collapsed && 'rotate-180')} />
              </button>
            ) : (
              <h2 className="text-sm font-semibold">{title}</h2>
            )}
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      <AnimatePresence initial={false}>
        {(!collapsible || !collapsed) && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={collapsible ? { opacity: 0, height: 0 } : undefined}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
