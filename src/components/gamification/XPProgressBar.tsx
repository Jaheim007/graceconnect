import { motion } from 'framer-motion';
import { Zap, TrendingUp, Trophy } from 'lucide-react';
import { getLevel } from '@/hooks/useGamificationEngine';
import { useI18n } from '@/i18n/I18nContext';

interface XPProgressBarProps {
  points: number;
  compact?: boolean;
}

export function XPProgressBar({ points, compact = false }: XPProgressBarProps) {
  const lvl = getLevel(points);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <span className="text-[11px] font-semibold">Lv. {lvl.level}</span>
            <span className="text-[10px] text-muted-foreground">{points} XP</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${lvl.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
        >
          {lvl.level >= 10 ? (
            <Trophy className="h-6 w-6 text-primary" />
          ) : (
            <Zap className="h-6 w-6 text-primary" />
          )}
        </motion.div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{isFr ? 'Niveau' : 'Level'} {lvl.level}</h3>
          <p className="text-xs text-muted-foreground">{points.toLocaleString()} XP {isFr ? 'au total' : 'total'}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
          <TrendingUp className="h-3 w-3" />
          {lvl.progress.toFixed(0)}%
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Lv. {lvl.level}</span>
          <span>Lv. {lvl.level < 10 ? lvl.level + 1 : 'MAX'}</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${lvl.progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
          />
          {/* Shimmer effect */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </div>
        {lvl.level < 10 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {lvl.nextMin - points} XP {isFr ? 'restants' : 'remaining'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
