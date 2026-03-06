import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, ExternalLink, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
}

export function StepCelebration({ state }: Props) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Use actual product URL if available
  const shareUrl = state.productId && state.orgSlug
    ? `https://siteviral.com/org/${state.orgSlug}/${state.productId}`
    : `https://siteviral.com/discover`;
  const shareTitle = state.title || 'Mon livre';

  const potentialEarning = !state.isFree && state.price > 0
    ? Math.round(state.price * state.commissionRate / 100)
    : 0;

  return (
    <div className="space-y-8 pt-8 text-center relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: window.innerHeight + 20,
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720,
                opacity: 0,
              }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="space-y-4"
      >
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          <PartyPopper className="h-10 w-10 text-primary" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold">
          🎉 TON LIVRE EST EN VENTE !
        </h2>

        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          « <strong className="text-foreground">{shareTitle}</strong> » est maintenant disponible.
          Partage-le pour commencer à gagner !
        </p>

        {potentialEarning > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-4 py-2 mx-auto"
          >
            <span className="text-xs text-muted-foreground">Chaque ami qui achète =</span>
            <span className="text-sm font-black text-accent">
              +{formatCurrency(potentialEarning, DEFAULT_CURRENCY)} pour toi
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Social Share Kit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SocialShareKit
          url={shareUrl}
          title={shareTitle}
          description={`Découvre "${shareTitle}" sur SiteViral !`}
          context="post-publication"
          price={state.isFree ? undefined : state.price}
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="space-y-3 pt-4"
      >
        <Button
          variant="outline"
          className="gap-2 w-full sm:w-auto"
          onClick={() => navigate('/dashboard')}
        >
          <ExternalLink className="h-4 w-4" /> Voir mon dashboard
        </Button>
        <div>
          <Button
            variant="ghost"
            className="gap-2 text-sm"
            onClick={() => navigate('/ecrire')}
          >
            <PenLine className="h-4 w-4" /> Écrire un autre livre
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
