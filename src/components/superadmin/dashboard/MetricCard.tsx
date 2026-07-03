import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accentColor?: string;
  delay?: number;
  onClick?: () => void;
}

const colorMap: Record<string, { icon: string; bg: string; glow: string }> = {
  primary: { icon: 'text-primary', bg: 'bg-primary/8', glow: 'bg-primary' },
  emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-500/8', glow: 'bg-emerald-500' },
  amber: { icon: 'text-amber-500', bg: 'bg-amber-500/8', glow: 'bg-amber-500' },
  violet: { icon: 'text-violet-500', bg: 'bg-violet-500/8', glow: 'bg-violet-500' },
  rose: { icon: 'text-rose-500', bg: 'bg-rose-500/8', glow: 'bg-rose-500' },
  blue: { icon: 'text-blue-500', bg: 'bg-blue-500/8', glow: 'bg-blue-500' },
  cyan: { icon: 'text-cyan-500', bg: 'bg-cyan-500/8', glow: 'bg-cyan-500' },
};

export function MetricCard({ label, value, sub, icon: Icon, accentColor = 'primary', delay = 0, onClick }: MetricCardProps) {
  const c = colorMap[accentColor] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 26 }}
      onClick={onClick}
      className={cn(
        'group relative bg-card border border-border/50 rounded-2xl p-5 overflow-hidden transition-all duration-300',
        'hover:border-border hover:shadow-[var(--shadow-elevated)]',
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      {/* Ambient glow */}
      <div className={cn('absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-[0.08] group-hover:opacity-[0.15] transition-opacity pointer-events-none', c.glow)} />

      <div className="relative z-10 flex items-start justify-between mb-3">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
        {onClick && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest truncate">{label}</p>
      <p className="text-xl lg:text-[22px] font-extrabold mt-1 tracking-tight tabular-nums truncate" title={String(value)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate" title={sub}>{sub}</p>}
    </motion.div>
  );
}
