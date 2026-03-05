import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { Zap, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const LEVELS = [
  { min: 0, label: { fr: 'Débutant', en: 'Newcomer' }, emoji: '🌱' },
  { min: 3, label: { fr: 'Explorateur', en: 'Explorer' }, emoji: '🔍' },
  { min: 8, label: { fr: 'Passionné', en: 'Enthusiast' }, emoji: '⚡' },
  { min: 15, label: { fr: 'Expert', en: 'Expert' }, emoji: '🏆' },
  { min: 30, label: { fr: 'Légende', en: 'Legend' }, emoji: '👑' },
];

export function EngagementLevel() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: stats } = useQuery({
    queryKey: ['engagement-stats', user?.id],
    queryFn: async () => {
      if (!user) return { purchases: 0, wishlists: 0, enrollments: 0 };
      const [{ count: purchases }, { count: wishlists }, { count: enrollments }] = await Promise.all([
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
        db.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      return { purchases: purchases || 0, wishlists: wishlists || 0, enrollments: enrollments || 0 };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (!user || !stats) return null;

  const totalActions = stats.purchases + stats.wishlists + stats.enrollments;
  const currentLevel = [...LEVELS].reverse().find(l => totalActions >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel
    ? Math.min(100, ((totalActions - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-3 mb-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLevel.emoji}</span>
          <div>
            <p className="text-xs font-semibold">{isFr ? currentLevel.label.fr : currentLevel.label.en}</p>
            <p className="text-[10px] text-muted-foreground">
              {totalActions} {isFr ? 'actions' : 'actions'}
            </p>
          </div>
        </div>
        {nextLevel && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">
              {isFr ? 'Prochain' : 'Next'}: {nextLevel.emoji} {isFr ? nextLevel.label.fr : nextLevel.label.en}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {nextLevel.min - totalActions} {isFr ? 'restantes' : 'remaining'}
            </p>
          </div>
        )}
      </div>
      <Progress value={progress} className="h-1.5" />
    </motion.div>
  );
}
