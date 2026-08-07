import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, ArrowRight, Download, CheckCircle, Zap, Users, Star, BookOpen } from 'lucide-react';
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
  const navigate = useNavigate();
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
                        <BookOpen className="h-6 w-6 text-primary" />
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
                    {onGoToResources && (
                      <Button onClick={onGoToResources} className="flex-1 gap-1.5 h-11 font-semibold">
                        <ArrowRight className="h-4 w-4" /> {isFr ? 'Accéder maintenant' : 'Access now'}
                      </Button>
                    )}
                    {onDownload && (
                      <Button variant="outline" onClick={onDownload} className="flex-1 gap-1.5 h-11">
                        <Download className="h-4 w-4" /> {isFr ? 'Télécharger' : 'Download'}
                      </Button>
                    )}
                  </div>

                  {/* WhatsApp prominent CTA */}
                  <Button
                    className="w-full h-11 gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold"
                    onClick={() => {
                      const text = isFr
                        ? `🔥 Je viens de ${isFreePurchase ? 'récupérer' : 'acheter'} "${productTitle}" sur SiteViral ! Découvre ça 👉 ${productUrl}`
                        : `🔥 I just ${isFreePurchase ? 'got' : 'bought'} "${productTitle}" on SiteViral! Check it out 👉 ${productUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => {
                      onClose();
                      const reviewUrl = productSlug
                        ? `/org/${orgSlug}/p/${productSlug}#reviews`
                        : `/org/${orgSlug}/product/${productId}#reviews`;
                      navigate(reviewUrl);
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
