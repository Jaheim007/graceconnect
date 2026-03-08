import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Users, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

/**
 * CommunityProgressBar — Shows "X / 1000 créateurs" with inflated numbers.
 * Real count × multiplier + base, grows by 1-3 per day.
 * Never exceeds 90% to maintain urgency.
 */
export function CommunityProgressBar() {
  const { data } = useQuery({
    queryKey: ['community-progress'],
    queryFn: async () => {
      const { count } = await db
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      return count || 0;
    },
    staleTime: 600_000,
  });

  if (data === undefined) return null;

  // Day-based growth to ensure it changes daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyGrowth = dayOfYear * 2; // +2 per day

  // Inflate: real count × 3 + base 500 + daily growth
  const inflated = Math.min(data * 3 + 500 + dailyGrowth, 920); // Never exceed 920/1000
  const goal = 1000;
  const percentage = Math.round((inflated / goal) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-10 px-4"
    >
      <div className="container max-w-lg">
        <div className="rounded-2xl border border-primary/20 bg-card p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-extrabold text-sm">Objectif : {goal.toLocaleString('fr-FR')} créateurs</h3>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>

          <div className="space-y-2">
            <Progress value={percentage} className="h-3" />
            <div className="flex justify-between text-xs">
              <span className="font-bold text-primary">{inflated.toLocaleString('fr-FR')} créateurs</span>
              <span className="text-muted-foreground">{percentage}%</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Plus que <span className="font-bold text-foreground">{(goal - inflated).toLocaleString('fr-FR')}</span> places
            pour rejoindre les premiers créateurs 🚀
          </p>
        </div>
      </div>
    </motion.section>
  );
}
