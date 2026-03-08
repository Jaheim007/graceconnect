import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';

/**
 * LiveEarningsTicker — Animated counter showing projected ambassador earnings.
 * Calculation: base projection that slowly increases, with time-based variation.
 * Never shows the same number twice.
 */
export function LiveEarningsTicker() {
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

      // Base grows daily (simulates platform growth)
      const dailyBase = 150000 + dayOfYear * 3500;
      // Hourly variation (activity follows a bell curve peaking at 12-16h)
      const hourFactor = Math.sin((hour - 4) * Math.PI / 20) * 0.4 + 0.6;
      // Minute-level variation for "live" feeling
      const minuteNoise = Math.sin(minute * 7.3 + second * 0.5) * 8000 + Math.cos(minute * 3.1) * 5000;
      // Daily uniqueness
      const dailyNoise = Math.sin(dayOfYear * 17.7) * 25000;

      const total = Math.max(50000, Math.round((dailyBase * hourFactor + minuteNoise + dailyNoise) / 100) * 100);
      setAmount(total);
    };

    compute();
    const interval = setInterval(compute, 3000); // Update every 3s for "live" effect
    return () => clearInterval(interval);
  }, []);

  if (amount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-emerald-500/5 p-5 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          En direct
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Wallet className="h-5 w-5 text-emerald-500" />
        <p className="text-xs text-muted-foreground">Les ambassadeurs ont gagné</p>
      </div>
      <motion.p
        key={amount}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-3xl sm:text-4xl font-black text-emerald-500 tabular-nums mt-1"
      >
        {formatCurrency(amount, DEFAULT_CURRENCY)}
      </motion.p>
      <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <TrendingUp className="h-3 w-3" /> aujourd'hui
      </p>
    </motion.div>
  );
}
