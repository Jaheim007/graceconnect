import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type MilestoneType =
  | 'first_purchase'
  | 'first_book'
  | 'first_sale'
  | 'first_affiliate'
  | '10_sales'
  | '50_sales'
  | 'first_payout';

const MILESTONES: Record<MilestoneType, { emoji: string; title: string; desc: string; color: string }> = {
  first_purchase: { emoji: '🛒', title: 'Premier achat !', desc: 'Tu as fait ton premier achat sur la plateforme.', color: 'from-primary to-blue-500' },
  first_book: { emoji: '📖', title: 'Auteur publié !', desc: 'Ton premier livre est en ligne. Bravo !', color: 'from-purple-500 to-pink-500' },
  first_sale: { emoji: '💰', title: 'Première vente !', desc: 'Quelqu\'un vient d\'acheter ton produit !', color: 'from-emerald-500 to-green-600' },
  first_affiliate: { emoji: '🤝', title: 'Ambassadeur actif !', desc: 'Tu as rejoint le programme ambassadeur.', color: 'from-amber-500 to-orange-500' },
  '10_sales': { emoji: '🔥', title: '10 ventes atteintes !', desc: 'Tu es en feu ! Continue comme ça.', color: 'from-red-500 to-orange-500' },
  '50_sales': { emoji: '🏆', title: 'Top vendeur !', desc: '50 ventes ! Tu fais partie des meilleurs.', color: 'from-amber-400 to-yellow-500' },
  first_payout: { emoji: '🎉', title: 'Premier retrait !', desc: 'Tu viens de retirer tes premiers gains.', color: 'from-emerald-400 to-teal-500' },
};

interface MilestoneUnlockProps {
  type: MilestoneType;
  onDismiss: () => void;
  onShare?: () => void;
}

/**
 * MilestoneUnlock — celebration modal for user achievements
 */
export function MilestoneUnlock({ type, onDismiss, onShare }: MilestoneUnlockProps) {
  const m = MILESTONES[type];

  const shareOnWhatsApp = () => {
    const text = `${m.emoji} ${m.title} — ${m.desc} Rejoins-moi sur SiteViral ! 👉 https://siteviral.com`;
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
          {/* Gradient header */}
          <div className={`bg-gradient-to-br ${m.color} p-8 text-center text-white relative overflow-hidden`}>
            {/* Sparkle particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 text-white/50" />
              </motion.div>
            ))}

            <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="text-5xl mb-3"
            >
              {m.emoji}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="h-5 w-5" />
                <h2 className="text-xl font-extrabold">Réussite débloquée</h2>
              </div>
              <p className="text-2xl font-extrabold">{m.title}</p>
            </motion.div>
          </div>

          {/* Body */}
          <div className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">{m.desc}</p>

            <div className="space-y-2">
              <Button onClick={shareOnWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                💬 Partager sur WhatsApp
              </Button>
              <Button variant="outline" className="w-full gap-2 text-xs" onClick={onDismiss}>
                Continuer
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
