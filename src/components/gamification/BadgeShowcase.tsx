import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description?: string;
  condition_type: string;
  condition_value: number;
}

interface BadgeShowcaseProps {
  allBadges: Badge[];
  earnedBadgeIds: Set<string>;
}

export function BadgeShowcase({ allBadges, earnedBadgeIds }: BadgeShowcaseProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  if (allBadges.length === 0) return null;

  const earned = allBadges.filter(b => earnedBadgeIds.has(b.id));
  const locked = allBadges.filter(b => !earnedBadgeIds.has(b.id));

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-gold" />
          {isFr ? 'Badges' : 'Badges'}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {earned.length}/{allBadges.length} {isFr ? 'débloqués' : 'unlocked'}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {allBadges.map((badge, i) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`relative text-center p-2.5 rounded-xl border transition-all cursor-default ${
                    isEarned
                      ? 'border-primary/30 bg-primary/5 shadow-sm'
                      : 'border-border opacity-35 grayscale'
                  }`}
                >
                  <span className="text-2xl block">{badge.icon}</span>
                  <p className="text-[10px] font-medium mt-1 truncate">{badge.name}</p>
                  {!isEarned && (
                    <Lock className="absolute top-1 right-1 h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[180px]">
                <p className="font-medium">{badge.name}</p>
                {badge.description && <p className="text-muted-foreground">{badge.description}</p>}
                <p className="text-muted-foreground mt-0.5">
                  {badge.condition_value} {badge.condition_type}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
