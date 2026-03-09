import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Rocket, Copy, Check, ArrowRight, Sparkles, Gift, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';

interface PostPurchaseCelebrationProps {
  productTitle: string;
  productId?: string;
  orgName: string;
  orgSlug?: string;
  amount: number;
  currency: string;
  commissionPercent?: number;
  coverImage?: string | null;
  onDismiss?: () => void;
}

/**
 * PostPurchaseCelebration — full-screen conversion modal
 * Converts buyers into ambassadors with SocialShareKit integration
 */
export function PostPurchaseCelebration({
  productTitle,
  productId,
  orgName,
  orgSlug,
  amount,
  currency,
  commissionPercent = 10,
  coverImage,
  onDismiss,
}: PostPurchaseCelebrationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  const potentialEarning = Math.round((amount * commissionPercent) / 100);
  const shareUrl = orgSlug
    ? `${window.location.origin}/org/${orgSlug}${affiliateCode ? `?ref=${affiliateCode}` : ''}`
    : window.location.origin;

  const enrollAsAmbassador = async () => {
    if (!user || enrolling || !orgSlug) return;
    setEnrolling(true);
    try {
      // Get org id from slug first
      const { data: orgData } = await db.from('organizations').select('id').eq('slug', orgSlug).single();
      if (!orgData) throw new Error('Org not found');
      const { error } = await db.rpc('self_enroll_affiliate', {
        _org_id: orgData.id,
      });
      if (error) throw error;
      // Get the affiliate link code
      const { data: linkData } = await db.from('affiliate_links').select('code').eq('user_id', user.id).eq('organization_id', orgData.id).maybeSingle();
      if (linkData?.code) {
        setAffiliateCode(linkData.code);
        setEnrolled(true);
        toast.success('🎉 Tu es maintenant ambassadeur !');
      }
    } catch (err: any) {
      const { data: existing } = await db.from('affiliate_links')
        .select('code')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (existing?.code) {
        setAffiliateCode(existing.code);
        setEnrolled(true);
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-md bg-card border-2 border-primary/20 rounded-3xl overflow-hidden relative"
      >
        {onDismiss && (
          <button onClick={onDismiss} className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Confetti header */}
        <div className="bg-gradient-to-br from-primary/10 via-emerald-500/10 to-amber-500/10 p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            className="text-5xl mb-3"
          >
            🎉
          </motion.div>

          {coverImage && (
            <div className="w-20 h-28 mx-auto mb-3 rounded-lg overflow-hidden shadow-lg border border-border">
              <img src={coverImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h2 className="text-xl font-black">Bravo, c'est à toi !</h2>
          <p className="text-sm text-muted-foreground mt-1">
            « {productTitle} » est dans ta bibliothèque 📚
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!enrolled ? (
            <motion.div
              key="convert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-5"
            >
              {/* Value proposition */}
              <div className="text-center">
                <h3 className="text-lg font-extrabold">
                  💰 Gagne en partageant
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu as aimé <strong>{productTitle}</strong> ?<br />
                  Partage et gagne <span className="font-bold text-emerald-500">{commissionPercent}%</span> sur chaque vente.
                </p>
              </div>

              {/* Concrete earnings */}
              <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Par vente</p>
                    <p className="text-2xl font-black text-emerald-500">{formatCurrency(potentialEarning, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">10 amis achètent</p>
                    <p className="text-2xl font-black">{formatCurrency(potentialEarning * 10, currency)}</p>
                  </div>
                </div>
                <div className="border-t border-emerald-500/20 mt-4 pt-3 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Simulation : 10 amis achètent = <strong className="text-foreground">{formatCurrency(potentialEarning * 10, currency)}</strong> pour toi
                  </p>
                </div>
              </div>

              {/* Primary CTA */}
              <Button
                onClick={enrollAsAmbassador}
                disabled={enrolling || !orgSlug}
                size="lg"
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-13 text-base font-bold rounded-xl"
              >
                {enrolling ? (
                  <span className="animate-pulse">Inscription…</span>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Oui, je veux gagner !
                  </>
                )}
              </Button>

              {/* Secondary dismiss */}
              <button
                onClick={onDismiss}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Non merci, peut-être plus tard
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-5"
            >
              {/* Success state */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3"
                >
                  <Check className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-extrabold">Tu es ambassadeur ! 🎉</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Partage maintenant pour commencer à gagner
                </p>
              </div>

              {/* SocialShareKit integration */}
              <SocialShareKit
                url={shareUrl}
                title={productTitle}
                context="post-purchase"
                price={amount}
                commissionRate={commissionPercent}
              />

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onDismiss?.();
                  navigate('/gagner');
                }}
              >
                Voir mes gains <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 pb-4">
          <p className="text-[10px] text-muted-foreground text-center">
            Aucun investissement. Tu gagnes uniquement quand quelqu'un achète via ton lien.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
