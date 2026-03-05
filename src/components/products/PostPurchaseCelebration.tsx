import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PartyPopper, Share2, Heart, ArrowRight, Download,
  CheckCircle, Sparkles, Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface PostPurchaseCelebrationProps {
  open: boolean;
  onClose: () => void;
  productTitle: string;
  orgName: string;
  orgSlug: string;
  productSlug?: string;
  productId: string;
  coverImageUrl?: string | null;
  isFreePurchase?: boolean;
  onGoToResources?: () => void;
  onDownload?: () => void;
}

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFA07A', '#DDA0DD', '#FFD700', '#87CEEB'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: -10,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: [0, 300 + Math.random() * 200],
        x: [0, (Math.random() - 0.5) * 120],
        opacity: [1, 1, 0],
        rotate: rotation + Math.random() * 720,
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export function PostPurchaseCelebration({
  open,
  onClose,
  productTitle,
  orgName,
  orgSlug,
  productSlug,
  productId,
  coverImageUrl,
  isFreePurchase,
  onGoToResources,
  onDownload,
}: PostPurchaseCelebrationProps) {
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const productUrl = productSlug
    ? `https://siteviral.com/org/${orgSlug}/p/${productSlug}`
    : `https://siteviral.com/org/${orgSlug}/product/${productId}`;

  const shareText = isFreePurchase
    ? `Je viens de télécharger "${productTitle}" de ${orgName} sur Siteviral ! 🎉 Essayez-le aussi :`
    : `Je viens d'acheter "${productTitle}" de ${orgName} sur Siteviral ! 🔥 Je recommande :`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${productUrl}`)}`, '_blank');
  };
  const handleShareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n${productUrl}`)}`, '_blank');
  };
  const handleShareFB = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
              {Array.from({ length: 40 }).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 0.05} x={Math.random() * 100} />
              ))}
            </div>
          )}

          {/* Header gradient */}
          <div className="relative bg-gradient-to-br from-emerald-500/20 via-primary/10 to-amber-500/10 px-6 pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
              className="relative inline-flex mb-4"
            >
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-extrabold"
            >
              {isFreePurchase ? 'Bravo ! 🎉' : 'Félicitations ! 🎉'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground mt-1"
            >
              {isFreePurchase
                ? 'Votre ressource gratuite est prête'
                : 'Votre achat a été confirmé avec succès'}
            </motion.p>
          </div>

          {/* Product card */}
          <div className="px-6 -mt-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
            >
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="" className="h-14 w-14 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold line-clamp-2">{productTitle}</p>
                <p className="text-xs text-muted-foreground">{orgName}</p>
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            </motion.div>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 space-y-4">
            {/* Primary actions */}
            <div className="flex gap-2">
              {onDownload && (
                <Button onClick={onDownload} className="flex-1 gap-1.5 h-11 font-semibold">
                  <Download className="h-4 w-4" /> Télécharger
                </Button>
              )}
              {onGoToResources && (
                <Button
                  variant={onDownload ? 'outline' : 'default'}
                  onClick={onGoToResources}
                  className="flex-1 gap-1.5 h-11"
                >
                  <ArrowRight className="h-4 w-4" /> Mes achats
                </Button>
              )}
            </div>

            {/* Share section */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">
                Partagez avec vos proches
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
                >
                  <span className="text-lg">💬</span>
                  <span className="text-[10px] font-medium text-muted-foreground">WhatsApp</span>
                </button>
                <button
                  onClick={handleShareX}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-sky-500/5 hover:bg-sky-500/10 transition-colors"
                >
                  <span className="text-lg">𝕏</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Twitter</span>
                </button>
                <button
                  onClick={handleShareFB}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                >
                  <span className="text-lg">📘</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Facebook</span>
                </button>
              </div>
            </div>

            {/* Ambassador CTA */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => {
                onClose();
                window.location.href = `/org/${orgSlug}?tab=store`;
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all group"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold">Gagnez en partageant</p>
                <p className="text-[10px] text-muted-foreground">Devenez ambassadeur et touchez des commissions</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {/* Close */}
          <div className="px-6 pb-5">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
              Continuer
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
