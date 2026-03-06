import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAffiliateLeaderboard, useMyAffiliateRank } from '@/hooks/useAffiliateMarketplace';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';

const RANK_STYLES = [
  { emoji: '🥇', ring: 'ring-2 ring-yellow-400/50 bg-yellow-400/10' },
  { emoji: '🥈', ring: 'ring-2 ring-gray-400/50 bg-gray-400/10' },
  { emoji: '🥉', ring: 'ring-2 ring-amber-600/50 bg-amber-600/10' },
];

export function AmbassadorLeaderboard() {
  const { data: leaders, isLoading } = useAffiliateLeaderboard(10);
  const { data: myRank } = useMyAffiliateRank();
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-extrabold">Top Ambassadeurs</h2>
      </div>

      {/* My rank card */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5 p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">Ton classement</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-accent">#{myRank.rank}</span>
              <div>
                <p className="text-sm font-bold">{formatCurrency(myRank.totalEarned, DEFAULT_CURRENCY)}</p>
                <p className="text-[10px] text-muted-foreground">{myRank.totalConversions} ventes · {myRank.totalClicks} clics</p>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
        </motion.div>
      )}

      {/* Leaderboard */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : !leaders?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sois le premier au classement ! 🚀
        </p>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader: any, i: number) => {
            const rankStyle = RANK_STYLES[i];
            const org = leader.organizations;
            const isMe = user?.id === leader.user_id;

            return (
              <motion.div
                key={leader.user_id + '-' + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-xl border border-border ${
                  isMe ? 'bg-accent/5 border-accent/30' : 'bg-card'
                } ${rankStyle?.ring || ''}`}
              >
                <div className="w-8 text-center shrink-0">
                  {rankStyle ? (
                    <span className="text-lg">{rankStyle.emoji}</span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold truncate">
                      {leader.code?.split('-')[0] || 'Ambassadeur'}
                    </p>
                    {isMe && <Badge variant="secondary" className="text-[9px] px-1.5">Toi</Badge>}
                  </div>
                  {org?.name && (
                    <p className="text-[10px] text-muted-foreground truncate">via {org.name}</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-accent">
                    {formatCurrency(leader.total_earned || 0, DEFAULT_CURRENCY)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {leader.conversions || 0} vente{(leader.conversions || 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
