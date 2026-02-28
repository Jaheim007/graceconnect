import { useStreak, useRecordActivity } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Compact streak widget shown on discover/feed pages to encourage daily returns.
 */
export function BuyerStreakWidget() {
  const { user } = useAuth();
  const { data: streak } = useStreak();
  const recordActivity = useRecordActivity();

  // Record daily activity on mount
  useEffect(() => {
    if (user && !recordActivity.isPending) {
      recordActivity.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user || !streak) return null;

  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak.current_streak) || 100;
  const isHot = streak.current_streak >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2"
    >
      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isHot ? 'bg-orange-500/15' : 'bg-muted/50'}`}>
        <Flame className={`h-4.5 w-4.5 ${isHot ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold">{streak.current_streak}</span>
          <span className="text-xs text-muted-foreground">jour{streak.current_streak !== 1 ? 's' : ''} consécutifs</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {streak.current_streak >= nextMilestone
            ? '🏆 Vous êtes un habitué !'
            : `Encore ${nextMilestone - streak.current_streak}j pour le badge ${nextMilestone}j`}
        </p>
      </div>
      {streak.longest_streak > streak.current_streak && (
        <div className="text-right">
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Trophy className="h-3 w-3" />
            <span>Record : {streak.longest_streak}j</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
