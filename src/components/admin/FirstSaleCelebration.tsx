import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfettiCelebration } from '@/components/gamification/ConfettiCelebration';
import { useI18n } from '@/i18n/I18nContext';

interface FirstSaleCelebrationProps {
  totalSales: number;
  orgName?: string;
  topProductTitle?: string;
}

/**
 * Shows a one-time confetti celebration when a creator gets their first sale.
 * Uses localStorage to avoid re-showing.
 */
export function FirstSaleCelebration({ totalSales, orgName, topProductTitle }: FirstSaleCelebrationProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [show, setShow] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  const storageKey = `first_sale_celebrated_${orgName || 'default'}`;

  useEffect(() => {
    if (totalSales > 0 && !localStorage.getItem(storageKey)) {
      // First sale detected — show celebration
      const timer = setTimeout(() => {
        setShow(true);
        setConfettiActive(true);
        localStorage.setItem(storageKey, 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [totalSales, storageKey]);

  const handleShare = () => {
    const text = isFr
      ? `🎉 Je viens de réaliser ma première vente${topProductTitle ? ` de "${topProductTitle}"` : ''} sur SiteViral ! 🚀\n\nCrée toi aussi et vends tes produits numériques 👉 https://siteviral.com`
      : `🎉 I just made my first sale${topProductTitle ? ` of "${topProductTitle}"` : ''} on SiteViral! 🚀\n\nCreate and sell your digital products too 👉 https://siteviral.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDismiss = () => {
    setShow(false);
    setConfettiActive(false);
  };

  if (!show) return null;

  return (
    <>
      <ConfettiCelebration
        active={confettiActive}
        onDone={() => setConfettiActive(false)}
      />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-amber-500/10 p-6 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <PartyPopper className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-extrabold">
                  {isFr ? '🎉 Première vente !' : '🎉 First sale!'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isFr
                    ? `Félicitations ! ${topProductTitle ? `"${topProductTitle}" vient d'être vendu` : 'Votre premier produit vient d\'être vendu'}. C'est le début de quelque chose de grand.`
                    : `Congratulations! ${topProductTitle ? `"${topProductTitle}" just sold` : 'Your first product just sold'}. This is the beginning of something great.`}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  className="gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold"
                  onClick={handleShare}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {isFr ? 'Partager' : 'Share'}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleDismiss}>
                  {isFr ? 'Fermer' : 'Dismiss'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
