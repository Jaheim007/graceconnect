import { useCountdown } from '@/hooks/useCountdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EventCountdownProps {
  endDate: string | null | undefined;
  className?: string;
  compact?: boolean;
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-lg">
          {/* Top half */}
          <div className="relative px-3 py-2 sm:px-4 sm:py-3">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={display}
                initial={{ y: -20, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                exit={{ y: 20, opacity: 0, rotateX: 90 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="block text-2xl sm:text-4xl font-black tabular-nums text-foreground"
                style={{ perspective: '200px' }}
              >
                {display}
              </motion.span>
            </AnimatePresence>
          </div>
          {/* Center line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
        </div>
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-xl bg-primary/5 blur-md -z-10" />
      </div>
      <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col gap-1.5"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      </motion.div>
      <div className="h-4" />
    </div>
  );
}

export function EventCountdown({ endDate, className, compact }: EventCountdownProps) {
  const { active, days, hours, minutes, seconds } = useCountdown(endDate);

  if (!active || !endDate) return null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {[
          { v: days, l: 'j' },
          { v: hours, l: 'h' },
          { v: minutes, l: 'm' },
          { v: seconds, l: 's' },
        ].map((item, i) => (
          <span key={i} className="inline-flex items-baseline gap-0.5">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={item.v}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 6, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold tabular-nums text-primary"
              >
                {String(item.v).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] text-muted-foreground font-medium">{item.l}</span>
            {i < 3 && <span className="text-muted-foreground/50 mx-0.5">:</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative p-4 sm:p-6 rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-card via-card to-primary/5',
        'border border-border shadow-xl',
        className
      )}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* Pulsing ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-primary/10"
        animate={{ scale: [1, 1.02, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10">
        <motion.p
          className="text-xs font-semibold text-primary uppercase tracking-widest text-center mb-4"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⏱ Compte à rebours
        </motion.p>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <FlipDigit value={days} label="Jours" />
          <Separator />
          <FlipDigit value={hours} label="Heures" />
          <Separator />
          <FlipDigit value={minutes} label="Min" />
          <Separator />
          <FlipDigit value={seconds} label="Sec" />
        </div>
      </div>
    </motion.div>
  );
}
