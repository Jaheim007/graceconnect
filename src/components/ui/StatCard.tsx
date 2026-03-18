import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  /** Semantic color accent */
  color?: 'primary' | 'emerald' | 'amber' | 'blue' | 'rose' | 'muted';
  /** Click handler or navigation */
  onClick?: () => void;
  delay?: number;
  className?: string;
}

const colorMap: Record<string, { icon: string; border: string; bg: string }> = {
  primary: { icon: 'text-primary', border: 'border-primary/20', bg: 'bg-primary/8' },
  emerald: { icon: 'text-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/8' },
  amber: { icon: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/8' },
  blue: { icon: 'text-blue-500', border: 'border-blue-500/20', bg: 'bg-blue-500/8' },
  rose: { icon: 'text-rose-500', border: 'border-rose-500/20', bg: 'bg-rose-500/8' },
  muted: { icon: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted/50' },
};

export function StatCard({ label, value, sub, icon: Icon, color = 'primary', onClick, delay = 0, className }: StatCardProps) {
  const c = colorMap[color];
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
      onClick={onClick}
      className={cn(
        'stat-gradient rounded-2xl border p-3 sm:p-4 text-left transition-all group overflow-hidden',
        c.border,
        onClick && 'hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer',
        className
      )}
    >
      <div className={cn('h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center mb-2 sm:mb-3', c.bg)}>
        <Icon className={cn('h-4 w-4', c.icon)} />
      </div>
      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</p>
      <p className="text-lg sm:text-2xl font-bold mt-0.5 tracking-tight truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>}
    </Component>
  );
}
