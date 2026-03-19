import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface DashboardPanelProps {
  title: string;
  icon: LucideIcon;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function DashboardPanel({ title, icon: Icon, badge, children, className, delay = 0 }: DashboardPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-border',
        className
      )}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          {title}
        </h3>
        {badge && <Badge variant="secondary" className="text-[10px] font-medium">{badge}</Badge>}
      </div>
      <div className="px-5 pb-5">
        {children}
      </div>
    </motion.div>
  );
}
