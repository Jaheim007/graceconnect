import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/currency';
import { Target, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function AdminRevenueGoals() {
  const { currentOrg } = useOrg();
  const currency = currentOrg?.currency || 'XOF';
  const [monthlyGoal, setMonthlyGoal] = useState(100000);

  const { data: thisMonthRevenue = 0 } = useQuery({
    queryKey: ['this-month-revenue', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [{ data: purchases }, { data: donations }] = await Promise.all([
        db.from('product_purchases')
          .select('organization_amount')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed')
          .gte('completed_at', startOfMonth.toISOString()),
        db.from('donations')
          .select('organization_amount')
          .eq('organization_id', currentOrg.id)
          .eq('status', 'completed')
          .gte('completed_at', startOfMonth.toISOString()),
      ]);

      const purchaseTotal = (purchases || []).reduce((s: number, p: any) => s + (p.organization_amount || 0), 0);
      const donationTotal = (donations || []).reduce((s: number, d: any) => s + (d.organization_amount || 0), 0);
      return purchaseTotal + donationTotal;
    },
    enabled: !!currentOrg?.id,
  });

  const progress = monthlyGoal > 0 ? Math.min((thisMonthRevenue / monthlyGoal) * 100, 100) : 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysLeft = daysInMonth - currentDay;
  const dailyTarget = monthlyGoal > 0 ? (monthlyGoal - thisMonthRevenue) / Math.max(daysLeft, 1) : 0;
  const isOnTrack = (thisMonthRevenue / Math.max(currentDay, 1)) * daysInMonth >= monthlyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-semibold text-sm">Objectif mensuel</h2>
        {progress >= 100 && (
          <Badge className="bg-green-500/15 text-green-600 text-[10px] ml-auto">
            <Trophy className="h-3 w-3 mr-0.5" /> Atteint !
          </Badge>
        )}
      </div>

      {/* Goal input */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Objectif :</span>
        <Input
          type="number"
          value={monthlyGoal}
          onChange={(e) => setMonthlyGoal(Number(e.target.value) || 0)}
          className="h-7 w-32 text-xs"
          min={0}
          step={5000}
        />
        <span className="text-xs text-muted-foreground">{currency}</span>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="font-medium">{formatCurrency(thisMonthRevenue, currency)}</span>
          <span className="text-muted-foreground">{formatCurrency(monthlyGoal, currency)}</span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-[10px] text-muted-foreground">{progress.toFixed(0)}% atteint</p>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-xl p-3">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground mb-1" />
          <p className="text-xs font-bold">{daysLeft}j</p>
          <p className="text-[10px] text-muted-foreground">restants</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          <TrendingUp className={`h-3.5 w-3.5 mb-1 ${isOnTrack ? 'text-green-500' : 'text-amber-500'}`} />
          <p className="text-xs font-bold">{formatCurrency(Math.max(dailyTarget, 0), currency)}/j</p>
          <p className="text-[10px] text-muted-foreground">rythme requis</p>
        </div>
      </div>
    </motion.div>
  );
}
