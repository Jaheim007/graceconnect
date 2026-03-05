import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Clock, Flame, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface UrgencyWidgetProps {
  saleEndsAt?: string | null;
  salesCount?: number;
  isFree?: boolean;
}

export function UrgencyWidget({ saleEndsAt, salesCount, isFree }: UrgencyWidgetProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [timeLeft, setTimeLeft] = useState('');

  const hasFlashSale = saleEndsAt && new Date(saleEndsAt) > new Date();

  useEffect(() => {
    if (!hasFlashSale) return;
    const update = () => {
      const diff = new Date(saleEndsAt!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hasFlashSale, saleEndsAt]);

  // Simulate "people viewing" based on sales
  const viewingNow = Math.max(2, Math.floor(Math.random() * 8) + Math.min(salesCount || 0, 15));

  if (isFree) return null;

  const showCountdown = hasFlashSale && timeLeft;
  const showPopularity = (salesCount || 0) >= 5;

  if (!showCountdown && !showPopularity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {showCountdown && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span className="text-xs font-semibold text-destructive">
            {isFr ? 'Offre expire dans' : 'Offer expires in'} {timeLeft}
          </span>
        </div>
      )}

      {showPopularity && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-500" />
            {salesCount}+ {isFr ? 'acheteurs' : 'buyers'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-blue-500" />
            {viewingNow} {isFr ? 'personnes consultent' : 'people viewing'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
