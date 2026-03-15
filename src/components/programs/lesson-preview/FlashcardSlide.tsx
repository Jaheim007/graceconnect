import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { RotateCw, Star } from 'lucide-react';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { useI18n } from '@/i18n/I18nContext';

export interface FlashcardData {
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardSlideProps {
  flashcard: FlashcardData;
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  onStarEarned?: () => void;
  gamificationEnabled?: boolean;
}

export function FlashcardSlide({
  flashcard, theme, slideIndex, totalSlides, lessonTitle,
  orgLogoUrl, deviceMode, onStarEarned, gamificationEnabled = true,
}: FlashcardSlideProps) {
  const [flipped, setFlipped] = useState(false);
  const [starGiven, setStarGiven] = useState(false);
  const isMobile = deviceMode === 'mobile';
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
      if (gamificationEnabled && !starGiven) {
        setStarGiven(true);
        onStarEarned?.();
      }
    } else {
      setFlipped(false);
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
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">F</div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Flashcard */}
      <div className={cn('flex-1 flex flex-col items-center justify-center relative z-10', isMobile ? 'px-4' : 'px-8')}>
        <motion.div
          className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isFr ? '🧠 Carte mémoire' : '🧠 Flashcard'}
        </motion.div>

        <motion.button
          onClick={handleFlip}
          className={cn(
            'relative w-full rounded-2xl cursor-pointer transition-all',
            isMobile ? 'max-w-[320px] min-h-[200px]' : 'max-w-[460px] min-h-[240px]',
            'shadow-2xl'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className={cn(
              'w-full h-full rounded-2xl flex flex-col items-center justify-center p-6',
              flipped
                ? 'bg-emerald-500/20 border-2 border-emerald-400/40 backdrop-blur-sm'
                : 'bg-white/95 border-2 border-white/80'
            )}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', damping: 20 }}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {!flipped ? (
              <div className="text-center">
                <p className={cn('font-bold text-slate-800 leading-snug', isMobile ? 'text-lg' : 'text-xl')}>
                  {flashcard.front}
                </p>
                {flashcard.hint && (
                  <p className="text-xs text-slate-400 mt-3 italic">{isFr ? 'Indice' : 'Hint'}: {flashcard.hint}</p>
                )}
                <div className="flex items-center gap-1.5 justify-center mt-4 text-slate-400">
                  <RotateCw className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">{isFr ? 'Tapez pour retourner' : 'Tap to flip'}</span>
                </div>
              </div>
            ) : (
              <motion.div
                className="text-center"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <p className={cn('font-bold text-emerald-100 leading-snug', isMobile ? 'text-lg' : 'text-xl')}>
                  {flashcard.back}
                </p>
                <div className="flex items-center gap-1.5 justify-center mt-4 text-emerald-300/60">
                  <RotateCw className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">{isFr ? 'Tapez pour retourner' : 'Tap to flip back'}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.button>

        {/* Star reward */}
        {flipped && gamificationEnabled && starGiven && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="flex items-center gap-2 mt-4 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-2"
          >
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-yellow-300 font-bold">+1 ⭐</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
