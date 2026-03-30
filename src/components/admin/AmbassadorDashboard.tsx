import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Users, TrendingUp, DollarSign, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

// Leaderboard export kept for backward compatibility but returns null
export function AmbassadorLeaderboard() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['ambassador-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data: links } = await db
        .from('affiliate_links')
        .select('clicks, conversions, total_earned')
        .eq('organization_id', orgId);
      
      if (!links) return null;
      return {
        totalAffiliates: links.length,
        totalClicks: links.reduce((sum, l) => sum + (l.clicks || 0), 0),
        totalConversions: links.reduce((sum, l) => sum + (l.conversions || 0), 0),
        totalEarned: links.reduce((sum, l) => sum + (l.total_earned || 0), 0),
      };
    },
    enabled: !!orgId,
  });

  if (isLoading) return <SkeletonRow count={2} />;

  // Stats overview only — NO leaderboard/ranking
  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ambassadeurs', value: stats.totalAffiliates, icon: Users, color: 'text-blue-500' },
            { label: 'Clics totaux', value: stats.totalClicks.toLocaleString(), icon: Link2, color: 'text-amber-500' },
            { label: 'Conversions', value: stats.totalConversions, icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Commissions', value: formatCurrency(stats.totalEarned, 'XOF'), icon: DollarSign, color: 'text-violet-500' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <s.icon className={cn('h-3.5 w-3.5', s.color)} />
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
