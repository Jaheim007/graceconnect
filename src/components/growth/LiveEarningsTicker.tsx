import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet } from 'lucide-react';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';
import { convertCurrency } from '@/lib/currencyConvert';

/**
 * LiveEarningsTicker — Animated counter showing projected ambassador earnings.
 * Adapts to user's display currency.
 */
export function LiveEarningsTicker() {
  const [baseAmount, setBaseAmount] = useState(0);
  const { currency, fmt } = useDisplayCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

      const dailyBase = 150000 + dayOfYear * 3500;
      const hourFactor = Math.sin((hour - 4) * Math.PI / 20) * 0.4 + 0.6;
      const minuteNoise = Math.sin(minute * 7.3 + second * 0.5) * 8000 + Math.cos(minute * 3.1) * 5000;
      const dailyNoise = Math.sin(dayOfYear * 17.7) * 25000;

      const total = Math.max(50000, Math.round((dailyBase * hourFactor + minuteNoise + dailyNoise) / 100) * 100);
      setBaseAmount(total);
    };

    compute();
    const interval = setInterval(compute, 3000);
    return () => clearInterval(interval);
  }, []);

  if (baseAmount === 0) return null;

  // Convert from XOF (base) to user's display currency
  const displayAmount = convertCurrency(baseAmount, 'XOF', currency) || baseAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-emerald-500/5 p-5 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <Wallet className="h-5 w-5 text-emerald-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          {isFr ? 'La semaine passée' : 'Last week'}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <p className="text-xs text-muted-foreground">{isFr ? 'Nos ambassadeurs ont gagné' : 'Our ambassadors earned'}</p>
      </div>
      <motion.p
        key={`${displayAmount}-${currency}`}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl sm:text-4xl font-black text-emerald-500 tabular-nums mt-1"
      >
        {fmt(displayAmount)}
      </motion.p>
      <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <TrendingUp className="h-3 w-3" /> {isFr ? 'en commissions' : 'in commissions'}
      </p>
    </motion.div>
  );
}
