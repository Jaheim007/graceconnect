import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Share2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

export type MilestoneType =
  | 'first_purchase'
  | 'first_book'
  | 'first_sale'
  | 'first_affiliate'
  | '10_sales'
  | '50_sales'
  | 'first_payout';

const MILESTONES: Record<MilestoneType, { emoji: string; title: { fr: string; en: string }; desc: { fr: string; en: string }; color: string }> = {
  first_purchase: { emoji: '🛒', title: { fr: 'Premier achat !', en: 'First purchase!' }, desc: { fr: 'Tu as fait ton premier achat sur la plateforme.', en: 'You made your first purchase on the platform.' }, color: 'from-primary to-blue-500' },
  first_book: { emoji: '📖', title: { fr: 'Auteur publié !', en: 'Published author!' }, desc: { fr: 'Ton premier livre est en ligne. Bravo !', en: 'Your first book is live. Well done!' }, color: 'from-purple-500 to-pink-500' },
  first_sale: { emoji: '💰', title: { fr: 'Première vente !', en: 'First sale!' }, desc: { fr: "Quelqu'un vient d'acheter ton produit !", en: 'Someone just bought your product!' }, color: 'from-emerald-500 to-green-600' },
  first_affiliate: { emoji: '🤝', title: { fr: 'Ambassadeur actif !', en: 'Active ambassador!' }, desc: { fr: "Tu as rejoint le programme ambassadeur.", en: 'You joined the ambassador program.' }, color: 'from-amber-500 to-orange-500' },
  '10_sales': { emoji: '🔥', title: { fr: '10 ventes atteintes !', en: '10 sales reached!' }, desc: { fr: 'Tu es en feu ! Continue comme ça.', en: "You're on fire! Keep it up." }, color: 'from-red-500 to-orange-500' },
  '50_sales': { emoji: '🏆', title: { fr: 'Top vendeur !', en: 'Top seller!' }, desc: { fr: '50 ventes ! Tu fais partie des meilleurs.', en: "50 sales! You're among the best." }, color: 'from-amber-400 to-yellow-500' },
  first_payout: { emoji: '🎉', title: { fr: 'Premier retrait !', en: 'First payout!' }, desc: { fr: 'Tu viens de retirer tes premiers gains.', en: 'You just withdrew your first earnings.' }, color: 'from-emerald-400 to-teal-500' },
};

interface MilestoneUnlockProps {
  type: MilestoneType;
  onDismiss: () => void;
  onShare?: () => void;
}

export function MilestoneUnlock({ type, onDismiss, onShare }: MilestoneUnlockProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const m = MILESTONES[type];
  const title = isFr ? m.title.fr : m.title.en;
  const desc = isFr ? m.desc.fr : m.desc.en;

  const shareOnWhatsApp = () => {
    const text = isFr
      ? `${m.emoji} ${title} — ${desc} Rejoins-moi sur SiteViral ! 👉 https://siteviral.com`
      : `${m.emoji} ${title} — ${desc} Join me on SiteViral! 👉 https://siteviral.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    onShare?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className={`bg-gradient-to-br ${m.color} p-8 text-center text-white relative overflow-hidden`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
              >
                
              </motion.div>
            ))}

            <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="h-4 w-4" />
            </button>

            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="text-5xl mb-3">
              {m.emoji}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="h-5 w-5" />
                <h2 className="text-xl font-extrabold">{isFr ? 'Réussite débloquée' : 'Achievement unlocked'}</h2>
              </div>
              <p className="text-2xl font-extrabold">{title}</p>
            </motion.div>
          </div>

          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{desc}</p>

            <div className="space-y-2">
              <Button onClick={shareOnWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                💬 {isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
              </Button>
              <Button variant="outline" className="w-full gap-2 text-xs" onClick={onDismiss}>
                {isFr ? 'Continuer' : 'Continue'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
