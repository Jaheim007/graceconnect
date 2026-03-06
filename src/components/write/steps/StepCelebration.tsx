import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, ArrowRight, PenLine, BookCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  onWriteAnother?: () => void;
}

export function StepCelebration({ state, onWriteAnother }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoToProduct = () => {
    if (state.productId) {
      navigate(`/admin/products/${state.productId}/edit`);
    } else {
      navigate('/admin/products');
    }
  };

  const handleWriteAnother = () => {
    if (onWriteAnother) {
      onWriteAnother();
      return;
    }

    localStorage.removeItem('write_wizard_draft');
    localStorage.removeItem('write_wizard_drafts_v2');
    navigate('/ecrire');
    window.location.reload();
  };

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
          {t('write.celebration_title')}
        </h2>

        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          « <strong className="text-foreground">{state.title || 'Mon livre'}</strong> » {t('write.celebration_sub')}
        </p>

        {/* Draft notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mx-auto"
        >
          <BookCheck className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-300 text-left">
            {t('write.draft_notice')}
          </span>
        </motion.div>
      </motion.div>

      {/* Single CTA: go to product dashboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 pt-4"
      >
        <Button
          className="gap-2 w-full sm:w-auto h-14 text-base cta-glow"
          onClick={handleGoToProduct}
        >
          <ArrowRight className="h-5 w-5" /> {t('write.go_to_product')}
        </Button>
        <div>
          <Button
            variant="ghost"
            className="gap-2 text-sm"
            onClick={handleWriteAnother}
          >
            <PenLine className="h-4 w-4" /> {t('write.write_another')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
