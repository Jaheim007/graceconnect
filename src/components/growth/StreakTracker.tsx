import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Gift, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakTrackerProps {
  className?: string;
}

const STREAK_KEY = 'sv-streak';
const STREAK_LAST_KEY = 'sv-streak-last';

function getStreak(): { count: number; lastDate: string } {
  const count = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
  const lastDate = localStorage.getItem(STREAK_LAST_KEY) || '';
  return { count, lastDate };
}

function updateStreak(): number {
  const today = new Date().toISOString().split('T')[0];
  const { count, lastDate } = getStreak();

  if (lastDate === today) return count; // Already visited today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newCount = lastDate === yesterday ? count + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(newCount));
  localStorage.setItem(STREAK_LAST_KEY, today);
  return newCount;
}

const MILESTONES = [
  { days: 3, label: '3 jours', reward: '🎯 Consistant', icon: Zap },
  { days: 7, label: '7 jours', reward: '🔥 En feu', icon: Flame },
  { days: 14, label: '14 jours', reward: 'Fidèle', icon: Star },
  { days: 30, label: '30 jours', reward: '🎁 Légende', icon: Gift },
];

/**
 * StreakTracker — daily engagement tracker with milestone rewards
 * Stores streak in localStorage for instant, no-auth tracking
 */
export function StreakTracker({ className }: StreakTrackerProps) {
  const [streak, setStreak] = useState(0);
  const [justIncremented, setJustIncremented] = useState(false);

  useEffect(() => {
    const { count: prevCount } = getStreak();
    const newCount = updateStreak();
    setStreak(newCount);
    if (newCount > prevCount) setJustIncremented(true);
  }, []);

  if (streak === 0) return null;

  const currentMilestone = MILESTONES.filter(m => streak >= m.days).pop();
  const nextMilestone = MILESTONES.find(m => streak < m.days);
  const progress = nextMilestone
    ? Math.round((streak / nextMilestone.days) * 100)
    : 100;

  return (
    <motion.div
      initial={justIncremented ? { scale: 0.95, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('bg-card border border-border rounded-2xl p-4', className)}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={justIncremented ? { rotate: [0, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0"
        >
          <Flame className="h-5 w-5 text-orange-500" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold">{streak}</span>
            <span className="text-xs text-muted-foreground">jour{streak > 1 ? 's' : ''} consécutif{streak > 1 ? 's' : ''}</span>
          </div>
          {currentMilestone && (
            <span className="text-[10px] font-semibold text-orange-500">{currentMilestone.reward}</span>
          )}
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              Prochain : {nextMilestone.reward}
            </span>
            <span className="text-[10px] font-medium">{streak}/{nextMilestone.days}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Milestone dots */}
      <div className="flex items-center justify-between mt-3 px-1">
        {MILESTONES.map((m) => {
          const MIcon = m.icon;
          const reached = streak >= m.days;
          return (
            <div key={m.days} className="flex flex-col items-center gap-1">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center transition-all',
                reached ? 'bg-orange-500 text-white scale-110' : 'bg-muted text-muted-foreground'
              )}>
                <MIcon className="h-3 w-3" />
              </div>
              <span className={cn('text-[9px]', reached ? 'font-bold text-orange-500' : 'text-muted-foreground')}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
