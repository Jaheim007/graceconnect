import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, MousePointerClick, ShoppingCart, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { cn } from '@/lib/utils';

/**
 * Live earnings counter that shows real-time clicks, conversions and earnings
 * with animated counters for the "first win" dopamine hit.
 */
export function LiveEarningsCounter() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['ambassador-live-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: links } = await db.from('affiliate_links')
        .select('clicks, conversions, total_earned')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (!links?.length) return null;
      return {
        clicks: links.reduce((s, l) => s + (l.clicks || 0), 0),
        conversions: links.reduce((s, l) => s + (l.conversions || 0), 0),
        earned: links.reduce((s, l) => s + (l.total_earned || 0), 0),
      };
    },
    enabled: !!user,
    refetchInterval: 30_000, // Poll every 30s for "live" feel
    staleTime: 15_000,
  });

  if (!user || !stats) return null;
  if (stats.clicks === 0 && stats.conversions === 0 && stats.earned === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-primary/5 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tes stats en direct</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Clics"
          value={stats.clicks}
          color="text-blue-500"
        />
        <StatBox
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Ventes"
          value={stats.conversions}
          color="text-emerald-500"
        />
        <StatBox
          icon={<TrendingUp className="h-4 w-4" />}
          label="Gagné"
          value={stats.earned}
          isCurrency
          color="text-accent"
        />
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value, isCurrency, color }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  isCurrency?: boolean;
  color: string;
}) {
  return (
    <div className="text-center space-y-1">
      <div className={cn('mx-auto w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center', color)}>
        {icon}
      </div>
      <AnimatedNumber value={value} isCurrency={isCurrency} />
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function AnimatedNumber({ value, isCurrency }: { value: number; isCurrency?: boolean }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (value === display) return;
    const diff = value - display;
    const steps = Math.min(Math.abs(diff), 20);
    const stepSize = diff / steps;
    let current = display;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current += stepSize;
      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, 50);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.p
      key={display}
      className="text-lg font-extrabold tabular-nums"
    >
      {isCurrency ? formatCurrency(display, DEFAULT_CURRENCY) : display.toLocaleString()}
    </motion.p>
  );
}
