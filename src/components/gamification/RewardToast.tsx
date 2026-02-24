import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Award } from 'lucide-react';

interface RewardToastProps {
  points?: number;
  badge?: { name: string; icon: string } | null;
  onDone?: () => void;
}

export function RewardToast({ points, badge, onDone }: RewardToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div className="bg-card border border-primary/30 rounded-2xl px-5 py-3 shadow-elevated flex items-center gap-3">
            {badge ? (
              <>
                <span className="text-3xl">{badge.icon}</span>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Award className="h-3 w-3" /> Badge débloqué !
                  </p>
                  <p className="font-bold text-sm">{badge.name}</p>
                </div>
              </>
            ) : points ? (
              <>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg text-primary">+{points} XP</p>
                  <p className="text-[10px] text-muted-foreground">Points gagnés !</p>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
