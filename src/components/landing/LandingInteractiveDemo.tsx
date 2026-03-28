import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

export function LandingInteractiveDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';

  const DEMO_STEPS = [
    { label: t('demo.step1'), preview: t('demo.step1_preview'), icon: PenLine },
    { label: t('demo.step2'), preview: t('demo.step2_preview'), icon: Sparkles },
    { label: t('demo.step3'), preview: t('demo.step3_preview'), icon: BookOpen },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
            {isFr ? 'Démo interactive' : 'Interactive demo'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {t('demo.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            {t('demo.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Step navigation + content */}
          <div>
            <div className="flex gap-2 mb-6">
              {DEMO_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                    activeStep === i
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
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
                className="relative rounded-2xl border border-border/60 bg-card p-8 min-h-[200px] shadow-[var(--shadow-card)]"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
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

          {/* Right: Visual placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="hidden lg:block"
          >
            <div className="rounded-2xl overflow-hidden border border-border/60 bg-card p-10 text-center shadow-[var(--shadow-elevated)]">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-bold mb-2">{isFr ? 'Studio IA Viral' : 'Viral AI Studio'}</p>
              <p className="text-sm text-muted-foreground">{isFr ? 'Créez votre livre en quelques clics avec l\'intelligence artificielle' : 'Create your book in a few clicks with artificial intelligence'}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
