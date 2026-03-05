import { useState, useEffect } from 'react';
import { Eye, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SocialProofWidgetProps {
  salesCount?: number;
  viewCount?: number;
  reviewCount?: number;
  averageRating?: number;
  className?: string;
}

/**
 * Social proof indicators for product pages:
 * - Simulated "live viewers" (realistic random)
 * - Real sales count
 * - Trust signal rotation
 */
export function SocialProofWidget({
  salesCount = 0,
  viewCount = 0,
  reviewCount = 0,
  averageRating = 0,
  className,
}: SocialProofWidgetProps) {
  const [liveViewers, setLiveViewers] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [activeSignal, setActiveSignal] = useState(0);

  // Simulate fluctuating live viewers
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(15, prev + delta));
      });
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  // Build trust signals
  const signals: { icon: typeof Eye; text: string; color: string }[] = [];

  signals.push({
    icon: Eye,
    text: `${liveViewers} personne${liveViewers > 1 ? 's' : ''} regarde${liveViewers > 1 ? 'nt' : ''} ce produit`,
    color: 'text-blue-500',
  });

  if (salesCount > 0) {
    signals.push({
      icon: ShoppingBag,
      text: salesCount >= 100 ? `${salesCount}+ acheteurs` : `${salesCount} acheteur${salesCount > 1 ? 's' : ''}`,
      color: 'text-emerald-500',
    });
  }

  if (reviewCount > 0 && averageRating > 0) {
    signals.push({
      icon: TrendingUp,
      text: `${averageRating.toFixed(1)}★ — ${reviewCount} avis vérifiés`,
      color: 'text-amber-500',
    });
  }

  if (salesCount >= 5) {
    signals.push({
      icon: Users,
      text: 'Produit populaire 🔥',
      color: 'text-orange-500',
    });
  }

  // Rotate signals
  useEffect(() => {
    if (signals.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSignal(prev => (prev + 1) % signals.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [signals.length]);

  if (signals.length === 0) return null;

  const current = signals[activeSignal % signals.length];
  const Icon = current.icon;

  return (
    <div className={cn('overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSignal}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', current.color.replace('text-', 'bg-'))} />
            <span className={cn('relative inline-flex rounded-full h-2 w-2', current.color.replace('text-', 'bg-'))} />
          </span>
          <Icon className={cn('h-3.5 w-3.5 shrink-0', current.color)} />
          <span className="text-muted-foreground">{current.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
