import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { Trophy, Medal, TrendingUp, MousePointerClick, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export function AffiliateLeaderboard() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const currency = currentOrg?.currency || 'XOF';

  const { data: affiliates = [] } = useQuery({
    queryKey: ['admin-affiliate-leaderboard', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data: links } = await db.from('affiliate_links')
        .select('id, code, user_id, clicks, conversions, total_earned, is_active')
        .eq('organization_id', currentOrg.id)
        .eq('is_active', true)
        .order('total_earned', { ascending: false })
        .limit(10);

      if (!links?.length) return [];

      const userIds = [...new Set(links.map((l: any) => l.user_id))];
      const { data: profiles } = await db.from('profiles').select('id, display_name, avatar_url').in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

      const topEarned = Math.max(...links.map((l: any) => l.total_earned || 0), 1);

      return links.map((l: any) => ({
        ...l,
        profile: profileMap[l.user_id],
        earnedPct: ((l.total_earned || 0) / topEarned) * 100,
        convRate: l.clicks > 0 ? ((l.conversions || 0) / l.clicks * 100).toFixed(1) : '0',
      }));
    },
    enabled: !!currentOrg?.id,
  });

  if (affiliates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="font-semibold text-sm">{isFr ? 'Top Ambassadeurs' : 'Top Ambassadors'}</h2>
        </div>
        <Badge variant="outline" className="text-[10px]">{affiliates.length} {isFr ? 'actifs' : 'active'}</Badge>
      </div>

      <div className="space-y-2.5">
        {affiliates.map((aff: any, i: number) => (
          <motion.div
            key={aff.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${i < 3 ? 'border-amber-500/15 bg-amber-500/5' : 'border-border'}`}
          >
            <span className="text-base w-6 text-center shrink-0">
              {RANK_ICONS[i] || <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
            </span>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {aff.profile?.avatar_url ? (
                <img src={aff.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold">{(aff.profile?.display_name || '?')[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold truncate">{aff.profile?.display_name || aff.code}</p>
                <span className="text-[10px] text-muted-foreground font-mono">{aff.code}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MousePointerClick className="h-2.5 w-2.5" /> {aff.clicks || 0}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <ShoppingCart className="h-2.5 w-2.5" /> {aff.conversions || 0}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" /> {aff.convRate}%
                </span>
              </div>
              <Progress value={aff.earnedPct} className="h-1 mt-1.5" />
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-primary">{formatCurrency(aff.total_earned || 0, currency)}</p>
              <p className="text-[10px] text-muted-foreground">{isFr ? 'gagné' : 'earned'}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
