import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Target, Flame, Trophy, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency';

interface AmbassadorTier {
  name: string;
  emoji: string;
  minEarnings: number;
  color: string;
}

const AMBASSADOR_TIERS: AmbassadorTier[] = [
  { name: 'Débutant', emoji: '🌱', minEarnings: 0, color: 'text-muted-foreground' },
  { name: 'Actif', emoji: '⚡', minEarnings: 5000, color: 'text-blue-500' },
  { name: 'Performant', emoji: '🔥', minEarnings: 25000, color: 'text-amber-500' },
  { name: 'Top Ambassadeur', emoji: '🏆', minEarnings: 100000, color: 'text-primary' },
  { name: 'Élite', emoji: '💎', minEarnings: 500000, color: 'text-rose-500' },
];

function getAmbassadorTier(earnings: number): { current: AmbassadorTier; next: AmbassadorTier | null; progress: number } {
  let current = AMBASSADOR_TIERS[0];
  for (const t of AMBASSADOR_TIERS) {
    if (earnings >= t.minEarnings) current = t;
  }
  const idx = AMBASSADOR_TIERS.indexOf(current);
  const next = idx < AMBASSADOR_TIERS.length - 1 ? AMBASSADOR_TIERS[idx + 1] : null;
  const progress = next
    ? ((earnings - current.minEarnings) / (next.minEarnings - current.minEarnings)) * 100
    : 100;
  return { current, next, progress: Math.min(progress, 100) };
}

export function AmbassadorGoalTracker() {
  const { user } = useAuth();

  const { data: salesData = [] } = useQuery({
    queryKey: ['ambassador-goal-sales', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db.from('affiliate_sales')
        .select('commission_amount, status, created_at')
        .eq('affiliate_user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: linksData = [] } = useQuery({
    queryKey: ['ambassador-goal-links', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db.from('affiliate_links')
        .select('clicks, conversions')
        .eq('user_id', user.id).eq('is_active', true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalEarnings = salesData.reduce((s, t: any) => s + (t.commission_amount || 0), 0);
  const totalClicks = linksData.reduce((s, l: any) => s + (l.clicks || 0), 0);
  const totalConversions = linksData.reduce((s, l: any) => s + (l.conversions || 0), 0);
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0';

  // Monthly stats
  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const monthEarnings = salesData
    .filter((s: any) => s.created_at >= monthStart)
    .reduce((sum, s: any) => sum + (s.commission_amount || 0), 0);

  const { current: tier, next: nextTier, progress: tierProgress } = getAmbassadorTier(totalEarnings);

  // Streak: consecutive months with at least 1 sale
  const monthsWithSales = useMemo(() => {
    const months = new Set<string>();
    salesData.forEach((s: any) => {
      if (s.created_at) months.add(s.created_at.slice(0, 7));
    });
    return months.size;
  }, [salesData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      {/* Tier + Progress */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
          {tier.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-bold', tier.color)}>{tier.name}</span>
            {nextTier && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <ArrowRight className="h-2.5 w-2.5" /> {nextTier.emoji} {nextTier.name}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(totalEarnings, 'XOF')} gagnés au total
          </p>
        </div>
      </div>

      {nextTier && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{tier.emoji} {tier.name}</span>
            <span>{nextTier.emoji} {nextTier.name} ({formatCurrency(nextTier.minEarnings, 'XOF')})</span>
          </div>
          <Progress value={tierProgress} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-1">
            Plus que {formatCurrency(nextTier.minEarnings - totalEarnings, 'XOF')} pour le prochain niveau
          </p>
        </div>
      )}

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Ce mois', value: formatCurrency(monthEarnings, 'XOF'), icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
          { label: 'Taux conversion', value: `${conversionRate}%`, icon: Target, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'Mois actifs', value: monthsWithSales.toString(), icon: Flame, color: 'text-amber-500 bg-amber-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-2.5 rounded-xl bg-muted/30">
            <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center mx-auto mb-1', stat.color)}>
              <stat.icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-bold">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly goals */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-primary" /> Objectifs du mois
        </h4>
        {[
          { label: '5 ventes ce mois', current: salesData.filter((s: any) => s.created_at >= monthStart).length, target: 5 },
          { label: `${formatCurrency(10000, 'XOF')} gagnés ce mois`, current: monthEarnings, target: 10000 },
        ].map((goal) => {
          const pct = Math.min((goal.current / goal.target) * 100, 100);
          const done = goal.current >= goal.target;
          return (
            <div key={goal.label} className="flex items-center gap-2">
              {done ? (
                <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className={cn(done && 'line-through text-muted-foreground')}>{goal.label}</span>
                  <span className="text-muted-foreground">{Math.round(pct)}%</span>
                </div>
                <Progress value={pct} className="h-1" />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
