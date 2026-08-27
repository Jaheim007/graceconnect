import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle, Flame, Zap } from 'lucide-react';
import type { QuizData } from './parseContentSlides';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { LessonImageBackdrop } from './LessonImageBackdrop';
import { useI18n } from '@/i18n/I18nContext';

interface QuizSlideProps {
  quiz: QuizData;
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  lessonImageUrl?: string;
  onStarEarned?: () => void;
  gamificationEnabled?: boolean;
}

function ConfettiBurst() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: (Math.random() - 0.5) * 300 - 100,
    rotation: Math.random() * 720,
    scale: 0.5 + Math.random() * 0.8,
    color: ['#FFD700', '#FF6B35', '#00D4AA', '#FF3366', '#7B61FF', '#00BFFF'][i % 6],
    delay: Math.random() * 0.15,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotation }}
          transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
          style={{ backgroundColor: p.color }}
          className="absolute w-3 h-3 rounded-sm"
        />
      ))}
    </div>
  );
}

export function QuizSlide({
  quiz, theme, slideIndex, totalSlides, lessonTitle,
  orgLogoUrl, deviceMode, lessonImageUrl, onStarEarned, gamificationEnabled = true,
}: QuizSlideProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const isMobile = deviceMode === 'mobile';
  // Graded quizzes hide the answer: the learner only sees whether they passed
  // once the whole lesson quiz is done.
  // Correct answers are never revealed to the learner: answers are recorded and
  // only the final score is shown at the end of the quiz.
  const showAnswer = false;
  const revealed = answered && showAnswer;
  const isCorrect = selected === quiz.correctIndex;
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (showAnswer && idx === quiz.correctIndex) {
      setShowConfetti(true);
      if (gamificationEnabled) onStarEarned?.();
    }
  };

  useEffect(() => {
    if (showConfetti) {
      const t = setTimeout(() => setShowConfetti(false), 1200);
      return () => clearTimeout(t);
    }
  }, [showConfetti]);

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <LessonImageBackdrop imageUrl={lessonImageUrl} />
      <SlideDecoration theme={theme} />
      {showConfetti && <ConfettiBurst />}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">Q</div>
        )}
        <span className="text-xs text-white/70 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Star reward indicator */}
      <AnimatePresence>
        {revealed && isCorrect && gamificationEnabled && (
          <motion.div
            initial={{ scale: 0, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, delay: 0.3 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
          >
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-xs border border-yellow-400/30 rounded-full px-4 py-2">
              <Star className="h-6 w-6 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
              <span className="text-sm text-yellow-300 font-bold">+1</span>
            </div>
          </motion.div>
        )}
        {revealed && !isCorrect && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 10 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-xs border border-amber-400/30 rounded-full px-4 py-2">
              <Flame className="h-5 w-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                {isFr ? 'Presque ! Continue 💪' : 'Almost! Keep going 💪'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz content */}
      <div className={cn(
        'flex-1 flex relative z-10 min-h-0',
        isMobile ? 'flex-col px-4 py-3 gap-4' : 'flex-row px-8 py-6 gap-6 items-center'
      )}>
        {/* Question */}
        <div className={cn('flex flex-col justify-center', isMobile ? '' : 'w-2/5')}>
          <motion.div
            className="mb-2 flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {isFr ? 'Quiz rapide' : 'Quick Quiz'}
            </span>
          </motion.div>
          <motion.h2
            className={cn('font-bold leading-snug', isMobile ? 'text-lg' : 'text-xl')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {quiz.question}
          </motion.h2>
        </div>

        {/* Options */}
        <div className={cn('flex flex-col gap-2.5', isMobile ? '' : 'w-3/5')}>
          {quiz.options.map((option, idx) => {
            const isThisCorrect = idx === quiz.correctIndex;
            const isSelected = idx === selected;
            return (
              <motion.button
                key={idx}
                onClick={() => handleSelect(idx)}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                whileHover={!answered ? { scale: 1.02, x: 4 } : {}}
                whileTap={!answered ? { scale: 0.98 } : {}}
                className={cn(
                  'relative text-left rounded-xl px-4 py-3 transition-all duration-200 text-sm font-medium border-2',
                  revealed
                    ? isThisCorrect
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : isSelected
                        ? 'bg-red-500/20 border-red-400 text-white/70'
                        : 'bg-white/5 border-white/10 text-white/40'
                    : answered && isSelected
                      ? 'bg-primary/20 border-white/70 text-white'
                      : answered
                        ? 'bg-white/10 border-white/10 text-white/50'
                        : 'bg-white/95 text-slate-800 border-white/80 hover:bg-white hover:border-white cursor-pointer shadow-lg hover:shadow-xl'
                )}
                disabled={answered}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all text-xs font-bold',
                    revealed
                      ? isThisCorrect
                        ? 'border-emerald-400 bg-emerald-400'
                        : isSelected
                          ? 'border-red-400 bg-red-400'
                          : 'border-white/20 bg-transparent text-white/30'
                      : 'border-slate-300 bg-transparent text-slate-500'
                  )}>
                    {revealed && isThisCorrect && <CheckCircle2 className="h-4 w-4 text-white" />}
                    {revealed && isSelected && !isThisCorrect && <XCircle className="h-4 w-4 text-white" />}
                    {!revealed && String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-white/10 px-5 py-2.5 flex items-center justify-between">
        {revealed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'text-xs font-medium flex items-center gap-2',
              isCorrect ? 'text-emerald-400' : 'text-amber-400'
            )}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isFr ? 'Excellent ! C\'est la bonne réponse ! 🎉🔥' : 'Excellent! That\'s correct! 🎉🔥'}
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                {quiz.explanation || (isFr ? 'Pas tout à fait… Continuez pour en apprendre plus !' : 'Not quite… Keep going to learn more!')}
              </>
            )}
          </motion.div>
        ) : answered ? (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium text-white/80 flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-white/70" />
            {isFr
              ? 'Réponse enregistrée — résultat à la fin du quiz.'
              : 'Answer recorded — result at the end of the quiz.'}
          </motion.span>
        ) : (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] text-white/50 uppercase font-bold tracking-widest"
          >
            {isFr ? 'Sélectionnez votre réponse' : 'Select your answer'}
          </motion.span>
        )}
        {revealed && isCorrect && gamificationEnabled && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
          >
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">+1</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
