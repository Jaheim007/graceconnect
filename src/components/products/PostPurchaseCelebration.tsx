import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PartyPopper, Share2, ArrowRight, Download,
  CheckCircle, Sparkles, Users, TrendingUp, Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { PostPurchaseRecommendations } from './PostPurchaseRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  organizationId,
  orgName,
  orgSlug,
  productSlug,
  productId,
  coverImageUrl,
  isFreePurchase,
  productType,
  price = 0,
  commissionRate = 20,
  onGoToResources,
  onDownload,
}: PostPurchaseCelebrationProps) {
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

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

  const handleBecomeAmbassador = async () => {
    if (!user) return;
    setEnrolling(true);
    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('affiliate_links')
        .select('id, code')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        toast.success('Tu es déjà ambassadeur pour ce produit !');
        setShowAmbassadorModal(true);
        return;
      }

      // Create affiliate link
      const code = `${orgSlug}-${productId.slice(0, 6)}-${user.id.slice(0, 4)}`.toLowerCase();
      const { error } = await supabase.from('affiliate_links').insert({
        user_id: user.id,
        organization_id: organizationId,
        product_id: productId,
        code,
        is_active: true,
      });

      if (error) throw error;
      toast.success('🎉 Tu es maintenant ambassadeur !');
      setShowAmbassadorModal(true);
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error("Erreur lors de l'inscription ambassadeur");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 bg-transparent shadow-none [&>button]:hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative bg-card rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Confetti */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
              {Array.from({ length: 40 }).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 0.05} x={Math.random() * 100} />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showAmbassadorModal ? (
              <motion.div key="main" exit={{ opacity: 0, x: -30 }}>
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
                  <h2 className="text-2xl font-extrabold">
                    {isFreePurchase ? 'Bravo ! 🎉' : 'Félicitations ! 🎉'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFreePurchase ? 'Ta ressource gratuite est prête' : 'Ton achat est confirmé'}
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
                        <Download className="h-4 w-4" /> Télécharger
                      </Button>
                    )}
                    {onGoToResources && (
                      <Button variant={onDownload ? 'outline' : 'default'} onClick={onGoToResources} className="flex-1 gap-1.5 h-11">
                        <ArrowRight className="h-4 w-4" /> Mes achats
                      </Button>
                    )}
                  </div>

                  {/* ★ LEAVE A REVIEW CTA ★ */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => {
                      onClose();
                      // Navigate to product page review section
                      const reviewUrl = productSlug
                        ? `/org/${orgSlug}/p/${productSlug}#reviews`
                        : `/org/${orgSlug}/product/${productId}#reviews`;
                      window.location.href = reviewUrl;
                    }}
                  >
                    <Star className="h-3.5 w-3.5" /> Laisser un avis sur ce produit
                  </Button>

                  {/* ★ HIGH-CONVERSION AMBASSADOR CTA ★ */}
                  {!isFreePurchase && price > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-5 space-y-3"
                    >
                      <div className="text-center space-y-1">
                        <p className="text-sm font-extrabold">
                          Tu as aimé <span className="text-primary">« {productTitle} »</span> ?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Partage et gagne <span className="text-emerald-500 font-bold">{commissionRate}%</span> sur chaque vente.
                        </p>
                      </div>

                      {/* Concrete earnings */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl bg-card border border-border p-3">
                          <p className="text-lg font-extrabold text-emerald-500">
                            {commissionAmount.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">par vente</p>
                        </div>
                        <div className="rounded-xl bg-card border border-border p-3">
                          <p className="text-lg font-extrabold text-primary">
                            {(commissionAmount * 10).toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">10 amis achètent</p>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="w-full h-12 gap-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={handleBecomeAmbassador}
                        disabled={enrolling}
                      >
                        <TrendingUp className="h-4 w-4" />
                        {enrolling ? 'Inscription…' : 'Oui, je veux gagner !'}
                      </Button>

                      <button
                        onClick={onClose}
                        className="w-full text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        Non merci
                      </button>
                    </motion.div>
                  )}

                  {/* Simple share for free products */}
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
                    Continuer
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* AMBASSADOR SUCCESS SCREEN */
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
                  <h2 className="text-xl font-extrabold">🎉 Tu es ambassadeur !</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Partage maintenant pour gagner <strong className="text-emerald-500">{commissionAmount.toLocaleString('fr-FR')} FCFA</strong> par vente.
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
                  Fermer
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
