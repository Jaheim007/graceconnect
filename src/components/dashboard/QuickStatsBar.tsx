import { motion } from 'framer-motion';
import { TrendingUp, Users, BookOpen, ShoppingBag } from 'lucide-react';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';

interface QuickStatsBarProps {
  totalEarned?: number;
  totalSales?: number;
  totalClicks?: number;
  productsCount?: number;
  /** Currency of the earnings data (org currency) */
  currency?: string;
}

/**
 * Horizontal stats bar for dashboards — compact, visual, motivational
 */
export function QuickStatsBar({ totalEarned = 0, totalSales = 0, totalClicks = 0, productsCount = 0, currency }: QuickStatsBarProps) {
  const { fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const stats = [
    { icon: TrendingUp, value: fmt(totalEarned, currency), label: isFr ? 'Gains' : 'Earnings', color: 'text-accent' },
    { icon: ShoppingBag, value: String(totalSales), label: isFr ? 'Ventes' : 'Sales', color: 'text-primary' },
    { icon: Users, value: String(totalClicks), label: isFr ? 'Clics' : 'Clicks', color: 'text-blue-500' },
    { icon: BookOpen, value: String(productsCount), label: isFr ? 'Produits' : 'Products', color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="text-center p-3 rounded-xl border border-border bg-card"
        >
          <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
          <p className="text-sm font-extrabold leading-none">{s.value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
