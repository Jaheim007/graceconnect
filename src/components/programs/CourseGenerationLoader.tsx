import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useEffect, useState } from 'react';
import { BookOpen, Brain, Sparkles, Layers, Lightbulb, PenTool, Save, CheckCircle } from 'lucide-react';

const STEPS_FR = [
  { icon: Brain, text: 'Analyse du sujet…', duration: 6000 },
  { icon: Layers, text: 'Structuration des modules…', duration: 10000 },
  { icon: PenTool, text: 'Rédaction des leçons…', duration: 20000 },
  { icon: Lightbulb, text: 'Création des quiz interactifs…', duration: 15000 },
  { icon: Sparkles, text: 'Finalisation du cours…', duration: 15000 },
  { icon: Save, text: 'Enregistrement du cours…', duration: 30000 },
];

const STEPS_EN = [
  { icon: Brain, text: 'Analyzing the topic…', duration: 6000 },
  { icon: Layers, text: 'Structuring modules…', duration: 10000 },
  { icon: PenTool, text: 'Writing lesson content…', duration: 20000 },
  { icon: Lightbulb, text: 'Creating interactive quizzes…', duration: 15000 },
  { icon: Sparkles, text: 'Finalizing your course…', duration: 15000 },
  { icon: Save, text: 'Saving your course…', duration: 30000 },
];

interface Props {
  phase?: 'generating' | 'saving' | 'done';
}

export function CourseGenerationLoader({ phase = 'generating' }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const steps = isFr ? STEPS_FR : STEPS_EN;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // When phase changes, jump progress and step
  useEffect(() => {
    if (phase === 'saving') {
      setCurrentStep(steps.length - 1);
      setProgress(85);
    } else if (phase === 'done') {
      setCurrentStep(steps.length - 1);
      setProgress(100);
    }
  }, [phase, steps.length]);

  useEffect(() => {
    if (phase !== 'generating') return;
    let stepTimeout: ReturnType<typeof setTimeout>;
    const advanceStep = () => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        // Don't advance past the saving step automatically
        if (next >= steps.length - 1) return prev;
        stepTimeout = setTimeout(advanceStep, steps[next].duration);
        return next;
      });
    };
    stepTimeout = setTimeout(advanceStep, steps[0].duration);
    return () => clearTimeout(stepTimeout);
  }, [steps.length, phase]);

  useEffect(() => {
    if (phase === 'done') return;
    const maxProgress = phase === 'saving' ? 95 : 82;
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.3, maxProgress));
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  const StepIcon = phase === 'done' ? CheckCircle : steps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8">
      {/* Animated orb */}
      <div className="relative w-28 h-28">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-primary/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/10"
          animate={phase === 'done' ? {} : { rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={phase === 'done' ? 'done' : currentStep}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StepIcon className={`h-10 w-10 ${phase === 'done' ? 'text-green-500' : 'text-primary'}`} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        {phase !== 'done' && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full bg-primary/60"
            style={{ top: '50%', left: '50%' }}
            animate={{
              x: [0, Math.cos((i * 2 * Math.PI) / 3) * 50, 0],
              y: [0, Math.sin((i * 2 * Math.PI) / 3) * 50, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* Step text */}
      <div className="text-center space-y-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={phase === 'done' ? 'done' : currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-semibold text-foreground"
          >
            {phase === 'done'
              ? (isFr ? '✅ Cours créé avec succès !' : '✅ Course created successfully!')
              : steps[currentStep].text}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-muted-foreground">
          {phase === 'done'
            ? (isFr ? 'Redirection en cours…' : 'Redirecting…')
            : (isFr ? 'Cela peut prendre 1 à 2 minutes' : 'This may take 1-2 minutes')}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${phase === 'done' ? 'bg-green-500' : 'bg-primary'}`}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right mt-1">{Math.round(progress)}%</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
            animate={{ width: i === currentStep ? 24 : 8 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
