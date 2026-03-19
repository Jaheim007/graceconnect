import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Users, DollarSign, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

export function AmbassadorLeaderboard() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ['ambassador-leaderboard', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('affiliate_links')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .eq('organization_id', orgId)
        .order('conversions', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: stats } = useQuery({
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

  if (isLoading) return <SkeletonRow count={3} />;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
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

      {/* Leaderboard */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Classement Ambassadeurs</h3>
        </div>

        {affiliates.length === 0 ? (
          <EmptyState variant="generic" title="Aucun ambassadeur" description="Activez le programme d'affiliation pour voir le classement." />
        ) : (
          <div className="space-y-1.5">
            {(affiliates as any[]).map((a, i) => {
              const convRate = a.clicks > 0 ? ((a.conversions || 0) / a.clicks * 100).toFixed(1) : '0';
              return (
                <div key={a.id} className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all',
                  i < 3 ? 'bg-amber-500/5 border border-amber-500/10' : 'hover:bg-muted/50'
                )}>
                  <span className="text-lg w-8 text-center shrink-0">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(a.profiles?.display_name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.profiles?.display_name || 'Anonyme'}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{a.code}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs font-bold">{a.conversions || 0} ventes</p>
                    <p className="text-[10px] text-muted-foreground">{a.clicks || 0} clics · {convRate}%</p>
                  </div>
                  {(a.total_earned || 0) > 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">
                      {formatCurrency(a.total_earned, 'XOF')}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
