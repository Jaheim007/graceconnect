import { useMemo } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Trophy, Flame, Target, CheckCircle2, Lock, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface Challenge {
  id: string;
  label: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  reward: string;
  icon: typeof Trophy;
}

export function MonthlyChallenges() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt } = useDisplayCurrency();

  const monthLabel = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString();
  }, []);

  const { data: monthSales = 0 } = useQuery({
    queryKey: ['month-sales', orgId, monthStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('product_purchases').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed').gte('created_at', monthStart);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: monthRevenue = 0 } = useQuery({
    queryKey: ['month-revenue', orgId, monthStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { data } = await db.from('product_purchases').select('amount').eq('organization_id', orgId).eq('status', 'completed').gte('created_at', monthStart);
      return (data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);
    },
    enabled: !!orgId,
  });

  const { data: monthMembers = 0 } = useQuery({
    queryKey: ['month-members', orgId, monthStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('joined_at', monthStart);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: monthContent = 0 } = useQuery({
    queryKey: ['month-content', orgId, monthStart],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('media_content').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', monthStart);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const challenges: Challenge[] = useMemo(() => [
    {
      id: 'sales-10',
      label: isFr ? '10 ventes ce mois' : '10 sales this month',
      description: isFr ? 'Atteignez 10 ventes pour débloquer le statut « Vendeur du mois ».' : 'Reach 10 sales to unlock "Seller of the month" status.',
      target: 10, current: monthSales, unit: isFr ? 'ventes' : 'sales',
      reward: isFr ? '🏅 Badge Vendeur du mois' : '🏅 Seller of the month badge', icon: Target,
    },
    {
      id: 'revenue-50k',
      label: isFr ? '50 000 FCFA de revenus' : '50,000 FCFA revenue',
      description: isFr ? 'Générez 50 000 FCFA de revenus ce mois-ci.' : 'Generate 50,000 FCFA revenue this month.',
      target: 50000, current: monthRevenue, unit: 'FCFA',
      reward: isFr ? '💎 Statut « Performer »' : '💎 "Performer" status', icon: Star,
    },
    {
      id: 'members-5',
      label: isFr ? '5 nouveaux membres' : '5 new members',
      description: isFr ? 'Attirez 5 nouveaux membres dans votre communauté.' : 'Attract 5 new members to your community.',
      target: 5, current: monthMembers, unit: isFr ? 'membres' : 'members',
      reward: isFr ? '🌟 Badge Communauté active' : '🌟 Active community badge', icon: Flame,
    },
    {
      id: 'content-4',
      label: isFr ? '4 contenus publiés' : '4 content published',
      description: isFr ? 'Publiez au moins 4 contenus (vidéos, audios, reels).' : 'Publish at least 4 pieces of content (videos, audio, reels).',
      target: 4, current: monthContent, unit: isFr ? 'contenus' : 'content',
      reward: isFr ? '📹 Badge Créateur prolifique' : '📹 Prolific creator badge', icon: Trophy,
    },
  ], [monthSales, monthRevenue, monthMembers, monthContent, isFr]);

  const completedCount = challenges.filter(c => c.current >= c.target).length;
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{isFr ? 'Défis du mois' : 'Monthly challenges'}</h3>
            <p className="text-[10px] text-muted-foreground capitalize">{monthLabel} — {daysLeft}{isFr ? 'j restants' : 'd left'}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-primary">{completedCount}/{challenges.length}</span>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => {
          const Icon = challenge.icon;
          const progress = Math.min((challenge.current / challenge.target) * 100, 100);
          const done = challenge.current >= challenge.target;
          return (
            <div key={challenge.id} className={cn('p-3 rounded-xl border transition-colors', done ? 'border-primary/20 bg-primary/5' : 'border-border')}>
              <div className="flex items-center gap-2 mb-2">
                {done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className={cn('text-xs font-semibold flex-1', done && 'line-through text-muted-foreground')}>{challenge.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {challenge.id === 'revenue-50k' ? `${(challenge.current / 1000).toFixed(0)}k / ${(challenge.target / 1000).toFixed(0)}k` : `${challenge.current} / ${challenge.target}`}
                </span>
              </div>
              <Progress value={progress} className="h-1.5 mb-1.5" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{challenge.description}</p>
                <span className="text-[9px] font-medium text-amber-600 shrink-0 ml-2">{challenge.reward}</span>
              </div>
            </div>
          );
        })}
      </div>

      {completedCount === challenges.length && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-rose-500/10 border border-primary/20 text-center">
          <p className="text-xs font-bold text-primary">{isFr ? '🏆 Tous les défis accomplis ! Vous êtes un champion !' : '🏆 All challenges completed! You\'re a champion!'}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
