import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

interface TourStep {
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
}

interface PageTourProps {
  pageId: string;
  steps: TourStep[];
}

const TOUR_PREFIX = 'sv_page_tour_';

export function PageTour({ pageId, steps }: PageTourProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [pageId]);

  const dismiss = () => {
    setVisible(false);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  if (!visible || steps.length === 0) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="bg-card border border-primary/20 rounded-2xl shadow-elevated p-4 space-y-3 relative"
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 pr-6"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              {current.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight">{t(current.titleKey)}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t(current.descKey)}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress + actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    i <= step ? 'w-4 bg-primary' : 'w-1.5 bg-muted'
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {t('tour.step_of').replace('{step}', String(step + 1)).replace('{total}', String(steps.length))}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={dismiss} className="h-7 text-[11px] text-muted-foreground px-2">
              {t('tour.skip')}
            </Button>
            <Button size="sm" onClick={next} className="h-7 text-[11px] gap-1 px-3">
              {step === steps.length - 1 ? (
                <><Sparkles className="h-3 w-3" /> {t('tour.done')}</>
              ) : (
                <>{t('tour.next')} <ChevronRight className="h-3 w-3" /></>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
