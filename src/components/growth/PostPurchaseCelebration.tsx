import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Rocket, Copy, Check, ArrowRight, Sparkles, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

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
 * PostPurchaseCelebration — converts buyers into ambassadors
 * Shows potential earnings + 1-click affiliate enrollment + social sharing
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
  const [copied, setCopied] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  const potentialEarning = Math.round((amount * commissionPercent) / 100);
  const shareUrl = orgSlug
    ? `${window.location.origin}/org/${orgSlug}${affiliateCode ? `?ref=${affiliateCode}` : ''}`
    : window.location.origin;

  const enrollAsAmbassador = async () => {
    if (!user || enrolling) return;
    setEnrolling(true);
    try {
      const { data, error } = await db.rpc('self_enroll_affiliate', {
        p_org_slug: orgSlug,
      });
      if (error) throw error;
      if (data?.code) {
        setAffiliateCode(data.code);
        setEnrolled(true);
        toast.success('🎉 Tu es maintenant ambassadeur !');
      }
    } catch (err: any) {
      // May already be enrolled
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = enrolled
      ? `📖 J'ai adoré « ${productTitle} » ! Découvre-le et j'obtiens une récompense 👉 ${shareUrl}`
      : `📖 Je viens de lire « ${productTitle} » sur ${orgName} — je te le recommande ! 👉 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden relative"
    >
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Gradient header */}
      <div className="bg-gradient-to-r from-primary/10 via-emerald-500/10 to-amber-500/10 p-5 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 items-center justify-center mb-3 shadow-lg"
        >
          <Gift className="h-7 w-7 text-white" />
        </motion.div>
        <h3 className="text-lg font-extrabold">💰 Gagne en partageant</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Partage ce produit et touche <span className="font-bold text-emerald-500">{commissionPercent}%</span> sur chaque vente
        </p>
      </div>

      {/* Earnings calculator */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Par vente</p>
            <p className="text-xl font-extrabold text-emerald-500">{formatCurrency(potentialEarning, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">10 ventes =</p>
            <p className="text-xl font-extrabold text-foreground">{formatCurrency(potentialEarning * 10, currency)}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {[
            { step: 1, label: 'Partage ton lien', icon: Share2, done: enrolled },
            { step: 2, label: 'Quelqu\'un achète', icon: Sparkles, done: false },
            { step: 3, label: 'Tu gagnes ta commission', icon: Rocket, done: false },
          ].map(({ step, label, icon: Icon, done }) => (
            <div key={step} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : step}
              </div>
              <span className="text-sm font-medium flex-1">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <AnimatePresence mode="wait">
          {!enrolled ? (
            <motion.div key="enroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button
                onClick={enrollAsAmbassador}
                disabled={enrolling || !orgSlug}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-sm font-bold"
              >
                {enrolling ? (
                  <span className="animate-pulse">Inscription en cours…</span>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Devenir ambassadeur — Gagner {formatCurrency(potentialEarning, currency)}/vente
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="share" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <Button onClick={shareWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11">
                💬 Partager sur WhatsApp
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={copyLink}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </Button>
                <Button variant="outline" className="flex-1 gap-2 text-xs" onClick={() => navigate('/gagner')}>
                  Voir mes gains <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-muted-foreground text-center">
          Aucun investissement. Tu gagnes uniquement quand quelqu'un achète.
        </p>
      </div>
    </motion.div>
  );
}
