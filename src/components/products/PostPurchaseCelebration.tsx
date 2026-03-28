import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PartyPopper, ArrowRight, Download,
  CheckCircle, Sparkles, Users, Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { PostPurchaseRecommendations } from './PostPurchaseRecommendations';
import { ConfettiEffect } from './ConfettiEffect';
import { AmbassadorEnrollCard } from './AmbassadorEnrollCard';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface PostPurchaseCelebrationProps {
  open: boolean;
  onClose: () => void;
  productTitle: string;
  organizationId: string;
  orgName: string;
  orgSlug: string;
  productSlug?: string;
  productId: string;
  coverImageUrl?: string | null;
  isFreePurchase?: boolean;
  productType?: string;
  price?: number;
  commissionRate?: number;
  onGoToResources?: () => void;
  onDownload?: () => void;
}

export function PostPurchaseCelebration({
  open, onClose, productTitle, organizationId, orgName, orgSlug,
  productSlug, productId, coverImageUrl, isFreePurchase, productType,
  price = 0, commissionRate = 20, onGoToResources, onDownload,
}: PostPurchaseCelebrationProps) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt } = useDisplayCurrency();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);

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

  const commissionAmount = Math.round(price * commissionRate / 100);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative bg-card rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {showConfetti && <ConfettiEffect />}

          <AnimatePresence mode="wait">
            {!showAmbassadorModal ? (
              <motion.div key="main" exit={{ opacity: 0, x: -30 }}>
                {/* Header */}
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
                  <h2 className="text-2xl font-extrabold">
                    {isFreePurchase
                      ? (isFr ? 'Bravo ! 🎉' : 'Well done! 🎉')
                      : (isFr ? 'Félicitations ! 🎉' : 'Congratulations! 🎉')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFreePurchase
                      ? (isFr ? 'Ta ressource gratuite est prête' : 'Your free resource is ready')
                      : (isFr ? 'Ton achat est confirmé' : 'Your purchase is confirmed')}
                  </p>
                </div>

                {/* Product card */}
                <div className="px-6 -mt-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
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
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-5 space-y-4">
                  <div className="flex gap-2">
                    {onDownload && (
                      <Button onClick={onDownload} className="flex-1 gap-1.5 h-11 font-semibold">
                        <Download className="h-4 w-4" /> {isFr ? 'Télécharger' : 'Download'}
                      </Button>
                    )}
                    {onGoToResources && (
                      <Button variant={onDownload ? 'outline' : 'default'} onClick={onGoToResources} className="flex-1 gap-1.5 h-11">
                        <ArrowRight className="h-4 w-4" /> {isFr ? 'Mes achats' : 'My purchases'}
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => {
                      onClose();
                      const reviewUrl = productSlug
                        ? `/org/${orgSlug}/p/${productSlug}#reviews`
                        : `/org/${orgSlug}/product/${productId}#reviews`;
                      window.location.href = reviewUrl;
                    }}
                  >
                    <Star className="h-3.5 w-3.5" /> {isFr ? 'Laisser un avis sur ce produit' : 'Leave a review'}
                  </Button>

                  {!isFreePurchase && price > 0 && (
                    <AmbassadorEnrollCard
                      productId={productId}
                      productTitle={productTitle}
                      organizationId={organizationId}
                      orgSlug={orgSlug}
                      price={price}
                      commissionRate={commissionRate}
                      isFr={isFr}
                      onEnrolled={() => setShowAmbassadorModal(true)}
                      onDecline={onClose}
                    />
                  )}

                  {(isFreePurchase || price === 0) && (
                    <SocialShareKit
                      url={productUrl}
                      title={productTitle}
                      context="post-purchase"
                    />
                  )}

                  <PostPurchaseRecommendations
                    organizationId={organizationId}
                    productId={productId}
                    productType={productType}
                    open={open}
                  />
                </div>

                <div className="px-6 pb-5">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
                    {isFr ? 'Continuer' : 'Continue'}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ambassador"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-6 py-8 space-y-5 text-center"
              >
                <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">{isFr ? '🎉 Tu es ambassadeur !' : '🎉 You are an ambassador!'}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFr
                      ? <>Partage maintenant pour gagner <strong className="text-emerald-500">{fmt(commissionAmount, 'XOF')}</strong> par vente.</>
                      : <>Share now to earn <strong className="text-emerald-500">{fmt(commissionAmount, 'XOF')}</strong> per sale.</>}
                  </p>
                </div>

                <SocialShareKit
                  url={productUrl}
                  title={productTitle}
                  context="ambassador"
                  price={price}
                  commissionRate={commissionRate}
                />

                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
                  {isFr ? 'Fermer' : 'Close'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
