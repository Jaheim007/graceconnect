import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthMetric {
  label: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
}

function computeHealth(metrics: {
  activeOrgs: number;
  totalOrgs: number;
  recentTx: number;
  pendingKyc: number;
  pendingPayouts: number;
  openReports: number;
  recentErrors: number;
}): { overall: number; details: HealthMetric[] } {
  const details: HealthMetric[] = [];

  // Org activation rate
  const activationRate = metrics.totalOrgs > 0 ? (metrics.activeOrgs / metrics.totalOrgs) * 100 : 100;
  details.push({
    label: 'Taux d\'activation orgs',
    score: Math.min(activationRate, 100),
    status: activationRate >= 70 ? 'good' : activationRate >= 40 ? 'warning' : 'critical',
  });

  // Transaction health (recent activity)
  const txScore = Math.min(metrics.recentTx * 5, 100);
  details.push({
    label: 'Activité transactionnelle (7j)',
    score: txScore,
    status: txScore >= 50 ? 'good' : txScore >= 20 ? 'warning' : 'critical',
  });

  // Pending KYC backlog
  const kycScore = Math.max(100 - metrics.pendingKyc * 10, 0);
  details.push({
    label: 'File d\'attente KYC',
    score: kycScore,
    status: metrics.pendingKyc <= 3 ? 'good' : metrics.pendingKyc <= 10 ? 'warning' : 'critical',
  });

  // Pending payouts
  const payoutScore = Math.max(100 - metrics.pendingPayouts * 8, 0);
  details.push({
    label: 'Payouts en attente',
    score: payoutScore,
    status: metrics.pendingPayouts <= 5 ? 'good' : metrics.pendingPayouts <= 15 ? 'warning' : 'critical',
  });

  // Content reports
  const reportScore = Math.max(100 - metrics.openReports * 15, 0);
  details.push({
    label: 'Signalements ouverts',
    score: reportScore,
    status: metrics.openReports <= 2 ? 'good' : metrics.openReports <= 5 ? 'warning' : 'critical',
  });

  const overall = Math.round(details.reduce((a, d) => a + d.score, 0) / details.length);
  return { overall, details };
}

export function PlatformHealthScore() {
  const { data } = useQuery({
    queryKey: ['sa-health-score'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [activeOrgs, totalOrgs, recentPurchases, recentDonations, pendingKyc, pendingPayouts, openReports] = await Promise.all([
        db.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        db.from('organizations').select('*', { count: 'exact', head: true }),
        db.from('product_purchases').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', sevenDaysAgo),
        db.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', sevenDaysAgo),
        db.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('payout_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return computeHealth({
        activeOrgs: activeOrgs.count || 0,
        totalOrgs: totalOrgs.count || 0,
        recentTx: (recentPurchases.count || 0) + (recentDonations.count || 0),
        pendingKyc: pendingKyc.count || 0,
        pendingPayouts: pendingPayouts.count || 0,
        openReports: openReports.count || 0,
        recentErrors: 0,
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const { overall, details } = data;
  const overallStatus = overall >= 75 ? 'good' : overall >= 50 ? 'warning' : 'critical';
  const statusColors = {
    good: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-destructive',
  };
  const StatusIcon = overallStatus === 'good' ? CheckCircle : overallStatus === 'warning' ? AlertTriangle : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/60 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-primary" />
          </div>
          Score Santé Plateforme
        </h3>
        <div className={cn('flex items-center gap-1.5 text-sm font-bold', statusColors[overallStatus])}>
          <StatusIcon className="h-4 w-4" />
          {overall}/100
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${overall}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            overallStatus === 'good' ? 'bg-green-500' : overallStatus === 'warning' ? 'bg-yellow-500' : 'bg-destructive'
          )}
        />
      </div>

      {/* Details */}
      <div className="space-y-2">
        {details.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{d.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    d.status === 'good' ? 'bg-green-500' : d.status === 'warning' ? 'bg-yellow-500' : 'bg-destructive'
                  )}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span className={cn('font-medium tabular-nums w-8 text-right', statusColors[d.status])}>
                {Math.round(d.score)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
