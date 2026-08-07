import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Trophy, ShoppingBag, Heart, Users, Star, Zap, Share2, BookOpen } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

interface MilestoneProps {
  purchases: number;
  donations: number;
  orgsJoined: number;
  streak: number;
  badges: number;
  affiliateLinks: number;
}

interface Milestone {
  id: string;
  label: string;
  icon: React.ReactNode;
  achieved: boolean;
  emoji: string;
}

export function UserMilestoneTracker({ purchases, donations, orgsJoined, streak, badges, affiliateLinks }: MilestoneProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const milestones: Milestone[] = useMemo(() => [
    { id: 'first_purchase', label: isFr ? 'Premier achat' : 'First purchase', icon: <ShoppingBag className="h-3.5 w-3.5" />, achieved: purchases >= 1, emoji: '🛍️' },
    { id: 'first_donation', label: isFr ? 'Premier don' : 'First donation', icon: <Heart className="h-3.5 w-3.5" />, achieved: donations >= 1, emoji: '❤️' },
    { id: 'join_community', label: isFr ? 'Rejoindre une communauté' : 'Join a community', icon: <Users className="h-3.5 w-3.5" />, achieved: orgsJoined >= 1, emoji: '🏠' },
    { id: '3_day_streak', label: isFr ? 'Série de 3 jours' : '3-day streak', icon: <Zap className="h-3.5 w-3.5" />, achieved: streak >= 3, emoji: '🔥' },
    { id: '5_purchases', label: isFr ? '5 achats' : '5 purchases', icon: <ShoppingBag className="h-3.5 w-3.5" />, achieved: purchases >= 5, emoji: '' },
    { id: 'first_affiliate', label: isFr ? 'Devenir ambassadeur' : 'Become ambassador', icon: <Share2 className="h-3.5 w-3.5" />, achieved: affiliateLinks >= 1, emoji: '🤝' },
    { id: '7_day_streak', label: isFr ? 'Série de 7 jours' : '7-day streak', icon: <Zap className="h-3.5 w-3.5" />, achieved: streak >= 7, emoji: '💪' },
    { id: '3_badges', label: isFr ? '3 badges débloqués' : '3 badges unlocked', icon: <Trophy className="h-3.5 w-3.5" />, achieved: badges >= 3, emoji: '🏆' },
    { id: '10_purchases', label: isFr ? '10 achats' : '10 purchases', icon: <Star className="h-3.5 w-3.5" />, achieved: purchases >= 10, emoji: '🌟' },
    { id: '30_day_streak', label: isFr ? 'Série de 30 jours' : '30-day streak', icon: <Zap className="h-3.5 w-3.5" />, achieved: streak >= 30, emoji: '👑' },
  ], [purchases, donations, orgsJoined, streak, badges, affiliateLinks, isFr]);

  const achievedCount = milestones.filter(m => m.achieved).length;
  const progress = (achievedCount / milestones.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{isFr ? 'Jalons' : 'Milestones'}</h3>
            <p className="text-[10px] text-muted-foreground">{achievedCount}/{milestones.length} {isFr ? 'complétés' : 'completed'}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-primary">{progress.toFixed(0)}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
        />
      </div>

      {/* Milestone grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {milestones.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all',
              m.achieved
                ? 'bg-amber-500/8 border border-amber-500/15 text-foreground'
                : 'bg-muted/30 border border-transparent text-muted-foreground'
            )}
          >
            {m.achieved ? (
              <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <span className="truncate">{m.emoji} {m.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
