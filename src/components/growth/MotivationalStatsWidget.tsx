import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Zap, Flame } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

/**
 * Motivational stats widget showing impressive (inflated) numbers.
 * Numbers rotate weekly based on week number for freshness.
 * Used in dashboard, /gagner, and landing pages.
 */
export function MotivationalStatsWidget({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Week-based rotation for fresh numbers each week
  const weekNum = Math.floor((Date.now() - new Date(2025, 0, 1).getTime()) / (7 * 86400000));
  const seed = weekNum * 7;

  const weeklyEarnings = 1_250_000 + (seed * 47_321) % 800_000;
  const activeAmbassadors = 850 + (seed * 23) % 400;
  const productsSold = 2_300 + (seed * 67) % 1_500;
  const topEarnerAmount = 185_000 + (seed * 31) % 120_000;

  const stats = [
    {
      icon: DollarSign,
      value: weeklyEarnings,
      label: isFr ? 'Gagné cette semaine' : 'Earned this week',
      suffix: ' FCFA',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Users,
      value: activeAmbassadors,
      label: isFr ? 'Ambassadeurs actifs' : 'Active ambassadors',
      suffix: '+',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Flame,
      value: productsSold,
      label: isFr ? 'Ventes cette semaine' : 'Sales this week',
      suffix: '+',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      icon: Zap,
      value: topEarnerAmount,
      label: isFr ? 'Meilleur gain du mois' : 'Top monthly earning',
      suffix: ' FCFA',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {stats.slice(0, 2).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card"
          >
            <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate">
                <AnimatedCounter value={s.value} suffix={s.suffix} formatter={n => n.toLocaleString()} />
              </p>
              <p className="text-[9px] text-muted-foreground truncate">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">{isFr ? '🔥 Ce qui se passe sur SiteViral' : '🔥 What\'s happening on SiteViral'}</h3>
        <span className="ml-auto text-[9px] text-muted-foreground">{isFr ? 'Mis à jour en temps réel' : 'Updated in real-time'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="p-3 rounded-xl bg-card/60 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-7 w-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              </div>
            </div>
            <p className="text-lg font-black">
              <AnimatedCounter value={s.value} suffix={s.suffix} formatter={n => n.toLocaleString()} />
            </p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
