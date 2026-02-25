import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Award, Sparkles } from 'lucide-react';

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
    }, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          {/* Glow ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.6, 2] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
          />

          <div className="relative bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl px-5 py-3.5 shadow-elevated flex items-center gap-3.5">
            {badge ? (
              <>
                <motion.span
                  initial={{ rotate: -20, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.15 }}
                  className="text-3xl"
                >
                  {badge.icon}
                </motion.span>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-medium">
                    <Award className="h-3 w-3 text-primary" /> Badge débloqué
                  </p>
                  <p className="font-bold text-sm">{badge.name}</p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: 2, duration: 0.4, delay: 0.3 }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
              </>
            ) : points ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                  className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Zap className="h-5 w-5 text-primary" />
                </motion.div>
                <div>
                  <motion.p
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-extrabold text-lg text-primary"
                  >
                    +{points} XP
                  </motion.p>
                  <p className="text-[10px] text-muted-foreground font-medium">Points gagnés !</p>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
