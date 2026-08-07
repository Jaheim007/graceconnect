import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Diamond, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';

interface BadgeConfig {
  threshold: number;
  icon: typeof Trophy;
  emoji: string;
  title: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}

const BADGES: BadgeConfig[] = [
  { threshold: 1, icon: Zap, emoji: '🌱', title: 'Première vente !', desc: 'Tu as fait ta première vente. Le voyage commence !', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { threshold: 10, icon: Flame, emoji: '🔥', title: '10 ventes !', desc: 'Tu es en feu ! 10 personnes t\'ont fait confiance.', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { threshold: 50, icon: Star, emoji: '', title: '50 ventes !', desc: 'Tu es une star ambassadrice. Continue comme ça !', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { threshold: 100, icon: Diamond, emoji: '💎', title: '100 ventes !', desc: 'Légende ! Tu fais partie du Top ambassadeurs.', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { threshold: 500, icon: Crown, emoji: '👑', title: '500 ventes !', desc: 'Roi/Reine des ambassadeurs. Inarrêtable.', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
];

export function AmbassadorBadges() {
  const { user } = useAuth();

  const { data: totalSales = 0 } = useQuery({
    queryKey: ['ambassador-total-sales', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db.from('affiliate_sales')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_user_id', user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  if (!user || totalSales === 0) return null;

  const earnedBadges = BADGES.filter(b => totalSales >= b.threshold);
  const nextBadge = BADGES.find(b => totalSales < b.threshold);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" /> Mes badges
      </h3>

      {/* Earned badges */}
      <div className="flex flex-wrap gap-2">
        {earnedBadges.map((badge, i) => (
          <motion.div
            key={badge.threshold}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border',
              badge.bg, badge.border
            )}
          >
            <span className="text-lg">{badge.emoji}</span>
            <div>
              <p className={cn('text-xs font-bold', badge.color)}>{badge.title}</p>
              <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Next badge progress */}
      {nextBadge && (
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg opacity-40">{nextBadge.emoji}</span>
            <p className="text-xs text-muted-foreground">
              Prochain badge : <strong>{nextBadge.title}</strong>
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalSales / nextBadge.threshold) * 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {totalSales} / {nextBadge.threshold} ventes
          </p>
        </div>
      )}
    </div>
  );
}
