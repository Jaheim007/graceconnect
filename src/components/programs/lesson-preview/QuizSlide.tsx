import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle } from 'lucide-react';
import type { QuizData } from './parseContentSlides';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';

interface QuizSlideProps {
  quiz: QuizData;
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  onStarEarned?: () => void;
}

export function QuizSlide({
  quiz,
  theme,
  slideIndex,
  totalSlides,
  lessonTitle,
  orgLogoUrl,
  deviceMode,
  onStarEarned,
}: QuizSlideProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const isMobile = deviceMode === 'mobile';
  const isCorrect = selected === quiz.correctIndex;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === quiz.correctIndex) {
      onStarEarned?.();
    }
  };

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <SlideDecoration theme={theme} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">Q</div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Star reward indicator */}
      <AnimatePresence>
        {revealed && isCorrect && (
          <motion.div
            initial={{ scale: 0, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
          >
            <Star className="h-10 w-10 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
            <span className="text-[10px] text-white/80 mt-0.5 font-medium">1 étoile gagnée !</span>
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
          <div className="mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Testez votre compréhension
            </span>
          </div>
          <h2 className={cn('font-bold leading-snug', isMobile ? 'text-lg' : 'text-xl')}>
            {quiz.question}
          </h2>
        </div>

        {/* Options */}
        <div className={cn('flex flex-col gap-2.5', isMobile ? '' : 'w-3/5')}>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40 text-right">
            Quelle est ta réponse ?
          </span>
          {quiz.options.map((option, idx) => {
            const isThisCorrect = idx === quiz.correctIndex;
            const isSelected = idx === selected;

            return (
              <motion.button
                key={idx}
                onClick={() => handleSelect(idx)}
                whileHover={!revealed ? { scale: 1.02 } : {}}
                whileTap={!revealed ? { scale: 0.98 } : {}}
                className={cn(
                  'relative text-left rounded-xl px-4 py-3 transition-all duration-200 text-sm font-medium border-2',
                  revealed
                    ? isThisCorrect
                      ? 'bg-emerald-500/20 border-emerald-400 text-white'
                      : isSelected
                        ? 'bg-red-500/20 border-red-400 text-white/70'
                        : 'bg-white/5 border-white/10 text-white/40'
                    : 'bg-white/95 text-slate-800 border-white/80 hover:bg-white hover:border-white cursor-pointer shadow-lg'
                )}
                disabled={revealed}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    revealed
                      ? isThisCorrect
                        ? 'border-emerald-400 bg-emerald-400'
                        : isSelected
                          ? 'border-red-400 bg-red-400'
                          : 'border-white/20 bg-transparent'
                      : 'border-slate-300 bg-transparent'
                  )}>
                    {revealed && isThisCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    {revealed && isSelected && !isThisCorrect && <XCircle className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer feedback */}
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
                C'est correct ! Bravo 🎉
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                {quiz.explanation || 'Pas tout à fait… Continuez pour en apprendre plus.'}
              </>
            )}
          </motion.div>
        ) : (
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
            Sélectionnez la bonne réponse
          </span>
        )}
        {revealed && isCorrect && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">+1</span>
          </div>
        )}
      </div>
    </div>
  );
}
