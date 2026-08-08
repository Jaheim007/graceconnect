import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle, Trophy, ChevronRight, Award } from 'lucide-react';
import type { QuizData } from './parseContentSlides';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { LessonImageBackdrop } from './LessonImageBackdrop';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

interface FinalAssessmentSlideProps {
  questions: QuizData[];
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  lessonImageUrl?: string;
  onComplete: (score: number, total: number) => void;
  gamificationEnabled?: boolean;
  /** Minimum percentage required to pass (0 = no requirement) */
  passingScore?: number;
  /** Move on once passed */
  onContinue?: () => void;
  /** Send the learner back to review the course content */
  onReview?: () => void;
}

export function FinalAssessmentSlide({
  questions, theme, slideIndex, totalSlides, lessonTitle,
  orgLogoUrl, deviceMode, lessonImageUrl, onComplete, gamificationEnabled = false,
  passingScore = 0, onContinue, onReview,
}: FinalAssessmentSlideProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const isMobile = deviceMode === 'mobile';
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const question = questions[currentQ];
  const isCorrect = answers[currentQ] === question?.correctIndex;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    // Answers are recorded but never graded on screen.
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
    setRevealed(true);
  };

  const handleRetry = () => {
    setAnswers(new Array(questions.length).fill(null));
    setCurrentQ(0);
    setRevealed(false);
    setFinished(false);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setRevealed(false);
    } else {
      const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
      setFinished(true);
      onComplete(score, questions.length);
    }
  };

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const starRating = Math.round((score / questions.length) * 5);

    return (
      <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
        <LessonImageBackdrop imageUrl={lessonImageUrl} />
        <SlideDecoration theme={theme} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, delay: 0.2 }} className="mb-6">
            <Trophy className={cn('h-16 w-16', pct >= 80 ? 'text-yellow-400' : pct >= 50 ? 'text-blue-400' : 'text-white/50')} />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-2xl font-bold mb-2 text-center">
            {pct >= 80
              ? (isFr ? '🔥 Excellent !' : '🔥 Excellent!')
              : pct >= 50
                ? (isFr ? '👏 Bien joué !' : '👏 Well done!')
                : (isFr ? '💪 Courage !' : '💪 Keep trying!')}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white/70 text-sm mb-6 text-center">
            {score} / {questions.length} {isFr ? 'réponses correctes' : 'correct answers'} ({pct}%)
          </motion.p>
          {gamificationEnabled && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex items-center gap-1.5 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.div key={s} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.7 + s * 0.1, type: 'spring' }}>
                  <Star className={cn('h-8 w-8 transition-colors', s <= starRating ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-white/20')} />
                </motion.div>
              ))}
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">
              {pct >= 80
                ? (isFr ? 'Maîtrise confirmée !' : 'Mastery confirmed!')
                : pct >= 50
                  ? (isFr ? 'En bonne voie !' : 'On track!')
                  : (isFr ? 'Révisez et réessayez !' : 'Review and try again!')}
            </span>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <LessonImageBackdrop imageUrl={lessonImageUrl} />
      <SlideDecoration theme={theme} />
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            <Trophy className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs text-white/70 flex-1 truncate">{isFr ? 'Évaluation finale' : 'Final Assessment'}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          Q{currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1 px-5 py-1.5 relative z-20">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full flex-1 transition-all duration-300',
              i < currentQ
                ? answers[i] === questions[i].correctIndex ? 'bg-emerald-400' : 'bg-red-400'
                : i === currentQ ? 'bg-white/60' : 'bg-white/15'
            )}
          />
        ))}
      </div>

      <div className={cn('flex-1 flex flex-col relative z-10 min-h-0 overflow-y-auto', isMobile ? 'px-4 py-3 gap-3' : 'px-8 py-4 gap-4')}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/80">
                  🏆 {isFr ? 'Évaluation finale' : 'Final Assessment'}
                </span>
              </div>
              <h2 className={cn('font-bold leading-snug', isMobile ? 'text-lg' : 'text-xl')}>
                {question.question}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {question.options.map((option, idx) => {
                const isThisCorrect = idx === question.correctIndex;
                const isSelected = idx === answers[currentQ];
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    whileHover={!revealed ? { scale: 1.01, x: 3 } : {}}
                    whileTap={!revealed ? { scale: 0.98 } : {}}
                    className={cn(
                      'relative text-left rounded-xl px-4 py-3 transition-all duration-200 text-sm font-medium border-2',
                      revealed
                        ? isThisCorrect
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : isSelected
                            ? 'bg-red-500/20 border-red-400 text-white/70'
                            : 'bg-white/5 border-white/10 text-white/40'
                        : 'bg-white/95 text-slate-800 border-white/80 hover:bg-white cursor-pointer shadow-lg'
                    )}
                    disabled={revealed}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold',
                        revealed
                          ? isThisCorrect
                            ? 'border-emerald-400 bg-emerald-400 text-white'
                            : isSelected
                              ? 'border-red-400 bg-red-400 text-white'
                              : 'border-white/20 text-white/30'
                          : 'border-slate-300 text-slate-500'
                      )}>
                        {revealed && isThisCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                         revealed && isSelected ? <XCircle className="h-4 w-4" /> :
                         String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {revealed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {question.explanation && (
                    <div className={cn(
                      'rounded-lg px-4 py-3 text-xs border',
                      isCorrect
                        ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-400/30 text-amber-300'
                    )}>
                      {isCorrect ? '✅ ' : '💡 '}{question.explanation}
                    </div>
                  )}
                  <Button onClick={handleNext} size="sm" className="w-full gap-2 bg-white/15 hover:bg-white/25 text-white border-0">
                    {currentQ < questions.length - 1
                      ? (isFr ? 'Question suivante' : 'Next question')
                      : (isFr ? 'Voir les résultats' : 'See results')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
