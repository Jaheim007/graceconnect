import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useEffect, useState } from 'react';
import { BookOpen, Brain, Sparkles, Layers, Lightbulb, PenTool } from 'lucide-react';

const STEPS_FR = [
  { icon: Brain, text: 'Analyse du sujet…', duration: 4000 },
  { icon: Layers, text: 'Structuration des modules…', duration: 5000 },
  { icon: PenTool, text: 'Rédaction des leçons…', duration: 8000 },
  { icon: Lightbulb, text: 'Création des quiz interactifs…', duration: 6000 },
  { icon: Sparkles, text: 'Finalisation du cours…', duration: 5000 },
];

const STEPS_EN = [
  { icon: Brain, text: 'Analyzing the topic…', duration: 4000 },
  { icon: Layers, text: 'Structuring modules…', duration: 5000 },
  { icon: PenTool, text: 'Writing lesson content…', duration: 8000 },
  { icon: Lightbulb, text: 'Creating interactive quizzes…', duration: 6000 },
  { icon: Sparkles, text: 'Finalizing your course…', duration: 5000 },
];

export function CourseGenerationLoader() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const steps = isFr ? STEPS_FR : STEPS_EN;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimeout: ReturnType<typeof setTimeout>;
    const advanceStep = () => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length) return prev; // stay on last step
        stepTimeout = setTimeout(advanceStep, steps[next].duration);
        return next;
      });
    };
    stepTimeout = setTimeout(advanceStep, steps[0].duration);
    return () => clearTimeout(stepTimeout);
  }, [steps.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.5, 95));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8">
      {/* Animated orb */}
      <div className="relative w-28 h-28">
        {/* Outer ring pulse */}
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
        {/* Center icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StepIcon className="h-10 w-10 text-primary" />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
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
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-semibold text-foreground"
          >
            {steps[currentStep].text}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-muted-foreground">
          {isFr ? 'Cela peut prendre 30 à 60 secondes' : 'This may take 30-60 seconds'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
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
