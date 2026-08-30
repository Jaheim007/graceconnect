import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface StickyBuyBarProps {
  title: string;
  price: number;
  isFree: boolean;
  currency?: string;
  isPurchased: boolean;
  salePrice?: number | null;
  onBuy: () => void;
  onAccess: () => void;
}

export function StickyBuyBar({ title, price, isFree, currency = 'XOF', isPurchased, salePrice, onBuy, onAccess }: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past 400px
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const hasDiscount = !isFree && salePrice && salePrice < price;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed left-0 right-0 z-30 bottom-[calc(env(safe-area-inset-bottom,0px)+6.75rem)] lg:hidden"
        >
          <div className="mx-2 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-foreground">{title}</p>
              <div className="flex items-center gap-1.5">
                <span className={cn('text-lg font-bold', isFree ? 'text-emerald-500' : 'text-primary')}>
                  {formatPrice(hasDiscount ? salePrice : price, isFree, currency)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(price, false, currency)}
                  </span>
                )}
              </div>
            </div>

            {isPurchased ? (
              <Button size="sm" className="gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={onAccess}>
                <Download className="h-3.5 w-3.5" /> Accéder
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5 shrink-0" onClick={onBuy}>
                {isFree ? <CheckCircle className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                {isFree ? 'Obtenir' : 'Acheter'}
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
