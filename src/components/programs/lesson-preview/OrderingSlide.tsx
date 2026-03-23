import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Star, CheckCircle2, XCircle, ArrowUpDown, GripVertical } from 'lucide-react';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { LessonImageBackdrop } from './LessonImageBackdrop';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';

export interface OrderingData {
  instruction?: string;
  items: string[];
  correctOrder: number[]; // indices into items array for correct order
}

interface OrderingSlideProps {
  ordering: OrderingData;
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

export function OrderingSlide({
  ordering, theme, slideIndex, totalSlides, lessonTitle,
  orgLogoUrl, deviceMode, lessonImageUrl, onStarEarned, gamificationEnabled = true,
}: OrderingSlideProps) {
  const isMobile = deviceMode === 'mobile';
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Shuffle items initially
  const [userOrder, setUserOrder] = useState<string[]>(() =>
    [...ordering.items].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [starGiven, setStarGiven] = useState(false);

  const correctSequence = ordering.correctOrder.map(i => ordering.items[i]);

  const handleSubmit = useCallback(() => {
    const correct = userOrder.every((item, idx) => item === correctSequence[idx]);
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct && gamificationEnabled && !starGiven) {
      setStarGiven(true);
      onStarEarned?.();
    }
  }, [userOrder, correctSequence, gamificationEnabled, starGiven, onStarEarned]);

  const handleRetry = () => {
    setSubmitted(false);
    setIsCorrect(false);
    setUserOrder([...ordering.items].sort(() => Math.random() - 0.5));
  };

  const moveItem = (fromIdx: number, direction: 'up' | 'down') => {
    if (submitted) return;
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= userOrder.length) return;
    const newOrder = [...userOrder];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    setUserOrder(newOrder);
  };

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <LessonImageBackdrop imageUrl={lessonImageUrl} />
      <SlideDecoration theme={theme} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">O</div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Title */}
      <div className="px-5 py-2 relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {isFr ? 'Remettez dans l\'ordre' : 'Put in order'}
        </div>
        {ordering.instruction && (
          <p className="text-sm text-white/70">{ordering.instruction}</p>
        )}
      </div>

      {/* Items */}
      <div className={cn('flex-1 flex flex-col relative z-10 min-h-0 overflow-y-auto', isMobile ? 'px-4 py-2 gap-2' : 'px-8 py-4 gap-2.5 max-w-xl mx-auto w-full')}>
        {userOrder.map((item, idx) => {
          const isCorrectPos = submitted && item === correctSequence[idx];
          const isWrongPos = submitted && !isCorrectPos;
          return (
            <motion.div
              key={item}
              layout
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 border-2 transition-all',
                submitted
                  ? isCorrectPos
                    ? 'bg-emerald-500/20 border-emerald-400/40'
                    : 'bg-red-500/20 border-red-400/40'
                  : 'bg-white/95 border-white/80 shadow-lg'
              )}
            >
              <span className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                submitted
                  ? isCorrectPos ? 'bg-emerald-400 text-white' : 'bg-red-400 text-white'
                  : 'bg-slate-200 text-slate-600'
              )}>
                {idx + 1}
              </span>
              <span className={cn(
                'flex-1 text-sm font-medium',
                submitted ? 'text-white' : 'text-slate-800'
              )}>
                {item}
              </span>
              {!submitted && (
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-20 p-0.5"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 12 12"><path d="M6 2L2 7h8L6 2z" fill="currentColor" /></svg>
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === userOrder.length - 1}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-20 p-0.5"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 12 12"><path d="M6 10L2 5h8L6 10z" fill="currentColor" /></svg>
                  </button>
                </div>
              )}
              {submitted && (
                isCorrectPos
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-white/10 px-5 py-2.5 flex items-center justify-between">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('text-xs font-medium flex items-center gap-2', isCorrect ? 'text-emerald-400' : 'text-amber-400')}
          >
            {isCorrect ? (
              <><CheckCircle2 className="h-4 w-4" /> {isFr ? 'Parfait ! Bon ordre ! 🎉' : 'Perfect! Correct order! 🎉'}</>
            ) : (
              <button onClick={handleRetry} className="flex items-center gap-2 hover:underline">
                <XCircle className="h-4 w-4" /> {isFr ? 'Pas tout à fait… Réessayez !' : 'Not quite… Try again!'}
              </button>
            )}
          </motion.div>
        ) : (
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
            {isFr ? 'Réordonnez puis validez' : 'Reorder then submit'}
          </span>
        )}
        <div className="flex items-center gap-2">
          {submitted && isCorrect && gamificationEnabled && (
            <motion.div className="flex items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">+1</span>
            </motion.div>
          )}
          {!submitted && (
            <Button size="sm" variant="secondary" onClick={handleSubmit} className="text-xs h-7 px-3">
              {isFr ? 'Valider' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
