import { motion } from 'framer-motion';
import { Zap, Star, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
          <Progress value={lvl.progress} className="h-1.5" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{isFr ? 'Niveau' : 'Level'} {lvl.level}</h3>
          <p className="text-xs text-muted-foreground">{points.toLocaleString()} XP</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {lvl.progress.toFixed(0)}%
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Lv. {lvl.level}</span>
          <span>Lv. {lvl.level < 10 ? lvl.level + 1 : 'MAX'}</span>
        </div>
        <Progress value={lvl.progress} className="h-2.5" />
        {lvl.level < 10 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {lvl.nextMin - points} XP {isFr ? 'restants' : 'remaining'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
