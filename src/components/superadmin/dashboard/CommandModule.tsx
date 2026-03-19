import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface CommandModuleProps {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string | number;
  accentColor?: string;
  delay?: number;
}

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  primary: { icon: 'text-primary', bg: 'bg-primary/8', border: 'hover:border-primary/25' },
  emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'hover:border-emerald-500/25' },
  amber: { icon: 'text-amber-500', bg: 'bg-amber-500/8', border: 'hover:border-amber-500/25' },
  violet: { icon: 'text-violet-500', bg: 'bg-violet-500/8', border: 'hover:border-violet-500/25' },
  rose: { icon: 'text-rose-500', bg: 'bg-rose-500/8', border: 'hover:border-rose-500/25' },
  blue: { icon: 'text-blue-500', bg: 'bg-blue-500/8', border: 'hover:border-blue-500/25' },
  cyan: { icon: 'text-cyan-500', bg: 'bg-cyan-500/8', border: 'hover:border-cyan-500/25' },
  orange: { icon: 'text-orange-500', bg: 'bg-orange-500/8', border: 'hover:border-orange-500/25' },
  pink: { icon: 'text-pink-500', bg: 'bg-pink-500/8', border: 'hover:border-pink-500/25' },
  teal: { icon: 'text-teal-500', bg: 'bg-teal-500/8', border: 'hover:border-teal-500/25' },
};

export function CommandModule({ label, description, icon: Icon, onClick, badge, accentColor = 'primary', delay = 0 }: CommandModuleProps) {
  const c = colorMap[accentColor] || colorMap.primary;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 26 }}
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-3.5 p-4 rounded-xl bg-card border border-border/50 text-left',
        'transition-all duration-200 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5',
        c.border
      )}
    >
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', c.bg)}>
        <Icon className={cn('h-5 w-5', c.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{label}</p>
          {badge !== undefined && badge !== 0 && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">{badge}</Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </motion.button>
  );
}
