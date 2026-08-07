import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Share2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { useI18n } from '@/i18n/I18nContext';

interface RevenueCelebrationProps {
  amount: number;
  milestone: string; // e.g. "10 000 FCFA", "Première vente"
  onDismiss: () => void;
}

/**
 * Popup celebration when an ambassador hits a revenue milestone.
 * Designed for viral sharing — includes SocialShareKit.
 */
export function RevenueCelebration({ amount, milestone, onDismiss }: RevenueCelebrationProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-card rounded-3xl border border-accent/20 shadow-2xl p-5 sm:p-8 max-w-sm w-[calc(100%-2rem)] space-y-5 relative overflow-y-auto max-h-[90dvh]"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-5xl"
            >
              🎉
            </motion.div>
            <div>
              <p className="text-xs font-bold text-accent uppercase tracking-wider flex items-center justify-center gap-1">
                <Zap className="h-3.5 w-3.5" /> {milestone}
              </p>
              <p className="text-3xl font-black text-accent mt-2">
                {formatCurrency(amount, DEFAULT_CURRENCY)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isFr ? "de gains en tant qu'ambassadeur !" : 'earned as an ambassador!'}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <SocialShareKit
              url="https://siteviral.com/gagner"
              title="Siteviral"
              context="earnings"
              earnings={amount}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
