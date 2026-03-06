import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Sparkles, ArrowRight, BookOpen, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

export function LandingInteractiveDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useI18n();

  const DEMO_STEPS = [
    { label: t('demo.step1'), preview: t('demo.step1_preview'), icon: PenLine },
    { label: t('demo.step2'), preview: t('demo.step2_preview'), icon: Sparkles },
    { label: t('demo.step3'), preview: t('demo.step3_preview'), icon: BookOpen },
  ];

  return (
    <section className="py-16 px-4 bg-muted/20 border-y border-border">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {t('demo.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t('demo.subtitle')}
          </p>
        </motion.div>

        <div className="flex gap-2 justify-center mb-8">
          {DEMO_STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                activeStep === i
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground bg-card'
              }`}
            >
              <step.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{t('demo.step_label')} {i + 1}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 text-center min-h-[180px] flex flex-col items-center justify-center"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              {(() => { const Icon = DEMO_STEPS[activeStep].icon; return <Icon className="h-7 w-7 text-primary" />; })()}
            </div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
              {t('demo.step_label')} {activeStep + 1} / 3
            </p>
            <p className="text-lg font-bold mb-2">{DEMO_STEPS[activeStep].label}</p>
            <p className="text-sm text-muted-foreground max-w-md">{DEMO_STEPS[activeStep].preview}</p>

            {activeStep < 2 ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 gap-1.5 text-xs"
                onClick={() => setActiveStep(s => s + 1)}
              >
                {t('demo.next_step')} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => navigate('/ecrire')}
              >
                {t('demo.try_now')} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}