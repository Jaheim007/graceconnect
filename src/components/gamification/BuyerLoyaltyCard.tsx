import { motion } from 'framer-motion';
import { useStreak, useBadges, BADGE_DEFINITIONS } from '@/hooks/useGamification';
import { useMyPurchases } from '@/hooks/usePurchases';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Trophy, Star, Gift, ShoppingBag, Zap, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const TIERS = [
  { name: 'Découverte', min: 0, icon: Star, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  { name: 'Fidèle', min: 3, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'VIP', min: 10, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Élite', min: 25, icon: Crown, color: 'text-primary', bg: 'bg-primary/10' },
];

function getTier(purchaseCount: number) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (purchaseCount >= t.min) tier = t;
  }
  const nextTier = TIERS.find(t => t.min > purchaseCount);
  const progress = nextTier
    ? ((purchaseCount - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;
  return { ...tier, next: nextTier, progress, purchaseCount };
}

export function BuyerLoyaltyCard() {
  const { user } = useAuth();
  const { data: streak } = useStreak();
  const { data: badges = [] } = useBadges();
  const { data: purchases = [] } = useMyPurchases();

  if (!user) return null;

  const completedPurchases = purchases.filter((p: any) => p.status === 'completed');
  const tier = getTier(completedPurchases.length);
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center border', tier.bg, `border-${tier.color.replace('text-', '')}/20`)}>
          <TierIcon className={cn('h-5 w-5', tier.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">Statut {tier.name}</h3>
            <Badge variant="secondary" className="text-[10px]">{completedPurchases.length} achats</Badge>
          </div>
          {tier.next && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Encore {tier.next.min - completedPurchases.length} achat{tier.next.min - completedPurchases.length > 1 ? 's' : ''} pour devenir {tier.next.name}
            </p>
          )}
        </div>
      </div>

      {/* Progression bar */}
      {tier.next && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{tier.name}</span>
            <span>{tier.next.name}</span>
          </div>
          <Progress value={tier.progress} className="h-2" />
        </div>
      )}

      {/* Streak & badges row */}
      <div className="flex items-center gap-4">
        {streak && (
          <div className="flex items-center gap-1.5 text-xs">
            <Flame className={cn('h-4 w-4', streak.current_streak >= 7 ? 'text-orange-500' : 'text-muted-foreground')} />
            <span className="font-semibold">{streak.current_streak}</span>
            <span className="text-muted-foreground">jour{streak.current_streak !== 1 ? 's' : ''}</span>
          </div>
        )}
        {badges.length > 0 && (
          <div className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium">{badges.length} badge{badges.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Earned badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.slice(0, 8).map((b: any) => {
            const def = BADGE_DEFINITIONS[b.badge_type];
            return (
              <div
                key={b.id}
                className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5"
                title={def?.description || b.badge_label}
              >
                <span className="text-xs">{def?.emoji || '🏅'}</span>
                <span className="text-[10px] font-medium">{def?.label || b.badge_label}</span>
              </div>
            );
          })}
          {badges.length > 8 && (
            <span className="text-[10px] text-muted-foreground self-center">+{badges.length - 8}</span>
          )}
        </div>
      )}

      {/* Encouragement */}
      {completedPurchases.length === 0 && (
        <div className="flex items-center gap-2 bg-primary/5 rounded-xl p-3">
          <Gift className="h-4 w-4 text-primary shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Faites votre premier achat pour débloquer votre parcours fidélité et gagner des badges !
          </p>
        </div>
      )}
    </motion.div>
  );
}
