import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-foreground/10 rounded-lg px-2 py-1 min-w-[36px] text-center">
        <span className="text-base font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function FlashSaleCountdown() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: flashProducts = [] } = useQuery({
    queryKey: ['flash-sale-products'],
    queryFn: async () => {
      const { data } = await db.from('digital_products')
        .select('id, title, slug, price, sale_price, sale_ends_at, currency, cover_image_url, organizations(slug, name)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .not('sale_price', 'is', null)
        .not('sale_ends_at', 'is', null)
        .gt('sale_ends_at', new Date().toISOString())
        .order('sale_ends_at', { ascending: true })
        .limit(3);
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  // Use countdown for the first product
  const firstProduct = flashProducts[0];
  const countdown = useCountdown(firstProduct?.sale_ends_at || null);

  if (flashProducts.length === 0 || countdown.expired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 relative overflow-hidden rounded-2xl border border-destructive/20 bg-gradient-to-r from-destructive/8 via-destructive/4 to-transparent p-4"
    >
      {/* Pulsing background */}
      <motion.div
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-destructive/10"
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              ⚡ {isFr ? 'Ventes Flash' : 'Flash Sales'}
              <span className="text-[10px] font-normal text-muted-foreground">
                ({flashProducts.length} {isFr ? 'offre' : 'deal'}{flashProducts.length > 1 ? 's' : ''})
              </span>
            </h3>
            <p className="text-xs text-muted-foreground truncate">{firstProduct.title}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-destructive shrink-0" />
          <div className="flex gap-1">
            {countdown.days > 0 && <CountdownUnit value={countdown.days} label={isFr ? 'j' : 'd'} />}
            <CountdownUnit value={countdown.hours} label="h" />
            <CountdownUnit value={countdown.minutes} label="m" />
            <CountdownUnit value={countdown.seconds} label="s" />
          </div>
        </div>

        {/* Price badge + CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {firstProduct.price && firstProduct.sale_price && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs line-through text-muted-foreground">
                {formatCurrency(firstProduct.price, firstProduct.currency)}
              </span>
              <span className="text-sm font-bold text-destructive">
                {formatCurrency(firstProduct.sale_price, firstProduct.currency)}
              </span>
              <span className="text-[10px] bg-destructive/15 text-destructive font-bold px-1.5 py-0.5 rounded-md">
                -{Math.round(((firstProduct.price - firstProduct.sale_price) / firstProduct.price) * 100)}%
              </span>
            </div>
          )}
          <button
            onClick={() => {
              const orgSlug = (firstProduct as any).organizations?.slug;
              const prodSlug = firstProduct.slug;
              if (orgSlug && prodSlug) navigate(`/org/${orgSlug}/product/${prodSlug}`);
            }}
            className="h-8 px-3 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold flex items-center gap-1 hover:bg-destructive/90 transition-colors"
          >
            {isFr ? 'Voir' : 'View'} <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
