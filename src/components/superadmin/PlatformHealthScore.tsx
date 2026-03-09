import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthMetric {
  label: string;
  score: number;
  status: 'good' | 'warning' | 'critical';
  detail?: string;
}

function computeHealth(metrics: {
  activeOrgs: number;
  totalOrgs: number;
  recentTx: number;
  pendingKyc: number;
  pendingPayouts: number;
  openReports: number;
  avgTtfvSeconds: number | null;
  avgTtfsHours: number | null;
  kFactor: number;
  activationRate: number;
  retentionJ7: number;
}): { overall: number; details: HealthMetric[] } {
  const details: HealthMetric[] = [];

  // TTFV (Time to First Value) — target < 60s
  const ttfvScore = metrics.avgTtfvSeconds !== null
    ? Math.max(0, Math.min(100, metrics.avgTtfvSeconds <= 60 ? 100 : 100 - (metrics.avgTtfvSeconds - 60) * 2))
    : 50;
  details.push({
    label: 'TTFV (< 60s)',
    score: Math.round(ttfvScore),
    status: metrics.avgTtfvSeconds !== null && metrics.avgTtfvSeconds <= 60 ? 'good' : metrics.avgTtfvSeconds !== null && metrics.avgTtfvSeconds <= 120 ? 'warning' : 'critical',
    detail: metrics.avgTtfvSeconds !== null ? `${Math.round(metrics.avgTtfvSeconds)}s` : 'N/A',
  });

  // TTFS (Time to First Sale) — target < 48h
  const ttfsScore = metrics.avgTtfsHours !== null
    ? Math.max(0, Math.min(100, metrics.avgTtfsHours <= 48 ? 100 : 100 - (metrics.avgTtfsHours - 48)))
    : 50;
  details.push({
    label: 'TTFS (< 48h)',
    score: Math.round(ttfsScore),
    status: metrics.avgTtfsHours !== null && metrics.avgTtfsHours <= 48 ? 'good' : metrics.avgTtfsHours !== null && metrics.avgTtfsHours <= 96 ? 'warning' : 'critical',
    detail: metrics.avgTtfsHours !== null ? `${Math.round(metrics.avgTtfsHours)}h` : 'N/A',
  });

  // K-Factor — target > 1.5
  const kScore = Math.min(100, (metrics.kFactor / 1.5) * 100);
  details.push({
    label: 'K-Factor (> 1.5)',
    score: Math.round(kScore),
    status: metrics.kFactor >= 1.5 ? 'good' : metrics.kFactor >= 1.0 ? 'warning' : 'critical',
    detail: metrics.kFactor.toFixed(2),
  });

  // Activation rate
  const activationScore = Math.min(metrics.activationRate, 100);
  details.push({
    label: 'Taux d\'activation',
    score: Math.round(activationScore),
    status: activationScore >= 50 ? 'good' : activationScore >= 25 ? 'warning' : 'critical',
    detail: `${Math.round(activationScore)}%`,
  });

  // Retention J7
  const retentionScore = Math.min(metrics.retentionJ7, 100);
  details.push({
    label: 'Rétention J7',
    score: Math.round(retentionScore),
    status: retentionScore >= 40 ? 'good' : retentionScore >= 20 ? 'warning' : 'critical',
    detail: `${Math.round(retentionScore)}%`,
  });

  // Org activation rate
  const orgActivationRate = metrics.totalOrgs > 0 ? (metrics.activeOrgs / metrics.totalOrgs) * 100 : 100;
  details.push({
    label: 'Orgs actives',
    score: Math.round(Math.min(orgActivationRate, 100)),
    status: orgActivationRate >= 70 ? 'good' : orgActivationRate >= 40 ? 'warning' : 'critical',
  });

  // Transaction health
  const txScore = Math.min(metrics.recentTx * 5, 100);
  details.push({
    label: 'Transactions (7j)',
    score: txScore,
    status: txScore >= 50 ? 'good' : txScore >= 20 ? 'warning' : 'critical',
  });

  // KYC backlog
  const kycScore = Math.max(100 - metrics.pendingKyc * 10, 0);
  details.push({
    label: 'File KYC',
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
    label: 'Signalements',
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
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [activeOrgs, totalOrgs, recentPurchases, recentDonations, pendingKyc, pendingPayouts, openReports, profilesRecent, profilesWithAction, affiliateUsers, totalUsers] = await Promise.all([
        db.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        db.from('organizations').select('*', { count: 'exact', head: true }),
        db.from('product_purchases').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', sevenDaysAgo),
        db.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', sevenDaysAgo),
        db.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('payout_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        // Profiles created in last 30 days for TTFV
        db.from('profiles').select('created_at, first_action_at').gte('created_at', thirtyDaysAgo).not('first_action_at', 'is', null).limit(100),
        // Profiles with at least 1 product (activation)
        db.from('digital_products').select('created_by', { count: 'exact', head: true }).eq('is_published', true),
        // Affiliate users (K-factor proxy)
        db.from('affiliate_links').select('user_id', { count: 'exact', head: true }),
        db.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      // Calculate TTFV (avg seconds between signup and first action)
      const profiles = profilesRecent.data || [];
      let avgTtfvSeconds: number | null = null;
      if (profiles.length > 0) {
        const ttfvValues = profiles.map((p: any) => {
          const created = new Date(p.created_at).getTime();
          const firstAction = new Date(p.first_action_at).getTime();
          return (firstAction - created) / 1000;
        }).filter((v: number) => v > 0 && v < 86400);
        if (ttfvValues.length > 0) {
          avgTtfvSeconds = ttfvValues.reduce((a: number, b: number) => a + b, 0) / ttfvValues.length;
        }
      }

      // K-Factor = affiliate-driven users / total users (simplified)
      const totalUsersCount = totalUsers.count || 1;
      const affiliateUsersCount = affiliateUsers.count || 0;
      const kFactor = (affiliateUsersCount / totalUsersCount) * 3; // Scaled

      // Activation rate = users with published products / total users
      const activatedCount = profilesWithAction.count || 0;
      const activationRate = (activatedCount / totalUsersCount) * 100;

      return computeHealth({
        activeOrgs: activeOrgs.count || 0,
        totalOrgs: totalOrgs.count || 0,
        recentTx: (recentPurchases.count || 0) + (recentDonations.count || 0),
        pendingKyc: pendingKyc.count || 0,
        pendingPayouts: pendingPayouts.count || 0,
        openReports: openReports.count || 0,
        avgTtfvSeconds,
        avgTtfsHours: null, // Would need first sale tracking — skip for now
        kFactor,
        activationRate,
        retentionJ7: 35, // Placeholder until tracking is implemented
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
  const StatusIcon = overallStatus === 'good' ? CheckCircle : AlertTriangle;

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
          Product Health Score
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
              {d.detail && (
                <span className="text-[10px] text-muted-foreground tabular-nums">{d.detail}</span>
              )}
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
