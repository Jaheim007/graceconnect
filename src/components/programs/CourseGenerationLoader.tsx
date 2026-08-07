import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';
import { useEffect, useState, useMemo } from 'react';
import { BookOpen, Brain, Zap, Layers, Lightbulb, PenTool, Save, CheckCircle, GraduationCap } from 'lucide-react';

const STEPS_FR = [
  { icon: Brain, text: 'Analyse du contenu…', emoji: '🧠' },
  { icon: Layers, text: 'Structuration des modules…', emoji: '📐' },
  { icon: PenTool, text: 'Rédaction des leçons…', emoji: '✍️' },
  { icon: Lightbulb, text: 'Création des quiz…', emoji: '💡' },
  { icon: Zap, text: 'Finalisation du cours…', emoji: '' },
  { icon: Save, text: 'Enregistrement…', emoji: '💾' },
];

const STEPS_EN = [
  { icon: Brain, text: 'Analyzing content…', emoji: '🧠' },
  { icon: Layers, text: 'Structuring modules…', emoji: '📐' },
  { icon: PenTool, text: 'Writing lessons…', emoji: '✍️' },
  { icon: Lightbulb, text: 'Creating quizzes…', emoji: '💡' },
  { icon: Zap, text: 'Finalizing course…', emoji: '' },
  { icon: Save, text: 'Saving…', emoji: '💾' },
];

const TIPS_FR = [
  'L\'IA structure votre cours en modules logiques',
  'Chaque leçon contient du contenu riche et interactif',
  'Des quiz sont générés automatiquement par module',
  'Les flashcards renforcent la mémorisation',
  'Vous pourrez tout personnaliser après la création',
];

const TIPS_EN = [
  'AI structures your course into logical modules',
  'Each lesson contains rich, interactive content',
  'Quizzes are auto-generated per module',
  'Flashcards reinforce memorization',
  'You can customize everything after creation',
];

interface Props {
  phase?: 'generating' | 'saving' | 'done';
  mode?: 'ai' | 'convert';
}

export function CourseGenerationLoader({ phase = 'generating', mode = 'ai' }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const steps = isFr ? STEPS_FR : STEPS_EN;
  const tips = isFr ? TIPS_FR : TIPS_EN;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Floating particles data — memoized to avoid recreating on every render
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: 3 + Math.random() * 5,
      x: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 4,
    })), []);

  useEffect(() => {
    if (phase === 'saving') {
      setCurrentStep(steps.length - 1);
      setProgress(85);
    } else if (phase === 'done') {
      setCurrentStep(steps.length - 1);
      setProgress(100);
    }
  }, [phase, steps.length]);

  // Step advancement
  useEffect(() => {
    if (phase !== 'generating') return;
    const durations = [5000, 9000, 18000, 13000, 13000];
    let timeout: ReturnType<typeof setTimeout>;
    const advance = () => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps.length - 1) return prev;
        timeout = setTimeout(advance, durations[next] || 10000);
        return next;
      });
    };
    timeout = setTimeout(advance, durations[0]);
    return () => clearTimeout(timeout);
  }, [steps.length, phase]);

  // Smooth progress
  useEffect(() => {
    if (phase === 'done') return;
    const max = phase === 'saving' ? 95 : 82;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 0.25, max));
    }, 350);
    return () => clearInterval(interval);
  }, [phase]);

  // Rotating tips
  useEffect(() => {
    if (phase === 'done') return;
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length, phase]);

  const StepIcon = phase === 'done' ? CheckCircle : steps[currentStep].icon;
  const isDone = phase === 'done';

  return (
    <div className="relative flex flex-col items-center justify-center py-10 px-4 space-y-6 overflow-hidden">
      {/* Floating background particles */}
      {!isDone && particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: -10,
          }}
          animate={{
            y: [-10, -300 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 60],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Main orb */}
      <div className="relative w-32 h-32">
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-4 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          }}
          animate={isDone ? {} : { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Spinning track ring */}
        {!isDone && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: 'hsl(var(--primary) / 0.5)',
              borderRightColor: 'hsl(var(--primary) / 0.2)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Secondary ring — counter-rotate */}
        {!isDone && (
          <motion.div
            className="absolute inset-2 rounded-full"
            style={{
              border: '1.5px solid transparent',
              borderBottomColor: 'hsl(var(--primary) / 0.3)',
              borderLeftColor: 'hsl(var(--primary) / 0.1)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Center icon circle */}
        <motion.div
          className={`absolute inset-4 rounded-full flex items-center justify-center ${
            isDone
              ? 'bg-green-500/15 border-2 border-green-500/30'
              : 'bg-primary/10 border-2 border-primary/20'
          }`}
          animate={isDone ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isDone ? 'done' : currentStep}
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 90, opacity: 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
            >
              <StepIcon className={`h-10 w-10 ${isDone ? 'text-green-500' : 'text-primary'}`} />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Orbiting dots */}
        {!isDone && [0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/50"
            style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
            animate={{
              x: Math.cos((i * Math.PI) / 2) * 55,
              y: Math.sin((i * Math.PI) / 2) * 55,
              opacity: [0.3, 1, 0.3],
              scale: [0.6, 1.2, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Step text + emoji */}
      <div className="text-center space-y-2 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={isDone ? 'done' : currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-lg">{isDone ? '🎉' : steps[currentStep].emoji}</span>
            <p className="text-sm font-semibold text-foreground">
              {isDone
                ? (isFr ? 'Cours créé avec succès !' : 'Course created successfully!')
                : steps[currentStep].text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Mode badge */}
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {mode === 'convert' ? (
              <><BookOpen className="h-3 w-3" /> {isFr ? 'Conversion IA' : 'AI Conversion'}</>
            ) : (
              <><Zap className="h-3 w-3" /> {isFr ? 'Génération IA' : 'AI Generation'}</>
            )}
          </span>
        </div>
      </div>

      {/* Progress bar — premium style */}
      <div className="w-full max-w-xs z-10">
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          {/* Shimmer effect on the track */}
          {!isDone && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <motion.div
            className={`h-full rounded-full relative ${isDone ? 'bg-green-500' : 'bg-primary'}`}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          >
            {/* Glow on the progress fill edge */}
            {!isDone && (
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-6 rounded-full bg-white/30"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-muted-foreground">
            {isDone
              ? (isFr ? 'Terminé !' : 'Complete!')
              : (isFr ? 'Cela peut prendre 1 à 2 min' : 'This may take 1-2 min')}
          </p>
          <p className="text-[10px] font-medium text-foreground">{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1.5 z-10">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className={`rounded-full transition-colors ${
              isDone
                ? 'bg-green-500'
                : i < currentStep
                  ? 'bg-primary'
                  : i === currentStep
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20'
            }`}
            animate={{
              width: i === currentStep && !isDone ? 20 : 6,
              height: 6,
            }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
          />
        ))}
      </div>

      {/* Rotating tips */}
      {!isDone && (
        <div className="w-full max-w-xs z-10">
          <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] text-muted-foreground text-center leading-relaxed"
              >
                💡 {tips[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Done celebration */}
      {isDone && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground z-10"
        >
          {isFr ? 'Redirection en cours…' : 'Redirecting…'}
        </motion.p>
      )}
    </div>
  );
}
