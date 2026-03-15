import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle, Link2 } from 'lucide-react';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { useI18n } from '@/i18n/I18nContext';

export interface MatchingData {
  pairs: { left: string; right: string }[];
}

interface MatchingSlideProps {
  matching: MatchingData;
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  onStarEarned?: () => void;
  gamificationEnabled?: boolean;
}

export function MatchingSlide({
  matching, theme, slideIndex, totalSlides, lessonTitle,
  orgLogoUrl, deviceMode, onStarEarned, gamificationEnabled = true,
}: MatchingSlideProps) {
  const isMobile = deviceMode === 'mobile';
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Shuffle right-side options
  const [shuffledRight] = useState(() =>
    [...matching.pairs.map(p => p.right)].sort(() => Math.random() - 0.5)
  );

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, string>>({}); // leftIdx -> rightVal
  const [wrongPair, setWrongPair] = useState<{ left: number; right: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [starGiven, setStarGiven] = useState(false);

  const matchedRights = new Set(Object.values(matches));

  const handleLeftClick = (idx: number) => {
    if (completed || matches[idx] !== undefined) return;
    setSelectedLeft(idx);
    setWrongPair(null);
  };

  const handleRightClick = useCallback((rightVal: string) => {
    if (completed || selectedLeft === null || matchedRights.has(rightVal)) return;

    const correctRight = matching.pairs[selectedLeft].right;
    if (rightVal === correctRight) {
      const newMatches = { ...matches, [selectedLeft]: rightVal };
      setMatches(newMatches);
      setSelectedLeft(null);

      // Check completion
      if (Object.keys(newMatches).length === matching.pairs.length) {
        setCompleted(true);
        if (gamificationEnabled && !starGiven) {
          setStarGiven(true);
          onStarEarned?.();
        }
      }
    } else {
      setWrongPair({ left: selectedLeft, right: rightVal });
      setTimeout(() => setWrongPair(null), 800);
    }
  }, [selectedLeft, matches, matching.pairs, completed, gamificationEnabled, starGiven, onStarEarned, matchedRights]);

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <SlideDecoration theme={theme} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">M</div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Title */}
      <div className="px-5 py-2 relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
          <Link2 className="h-3.5 w-3.5" />
          {isFr ? 'Associez les éléments' : 'Match the items'}
        </div>
      </div>

      {/* Matching grid */}
      <div className={cn('flex-1 flex relative z-10 min-h-0 overflow-y-auto', isMobile ? 'flex-col gap-3 px-4 py-2' : 'flex-row gap-6 px-8 py-4')}>
        {/* Left column */}
        <div className={cn('flex flex-col gap-2', isMobile ? 'w-full' : 'w-1/2')}>
          <span className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mb-1">
            {isFr ? 'Termes' : 'Terms'}
          </span>
          {matching.pairs.map((pair, idx) => {
            const isMatched = matches[idx] !== undefined;
            const isSelected = selectedLeft === idx;
            const isWrong = wrongPair?.left === idx;
            return (
              <motion.button
                key={idx}
                onClick={() => handleLeftClick(idx)}
                disabled={isMatched}
                className={cn(
                  'text-left rounded-xl px-4 py-3 text-sm font-medium border-2 transition-all',
                  isMatched
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : isWrong
                      ? 'bg-red-500/20 border-red-400 text-white animate-[shake_0.3s_ease-in-out]'
                      : isSelected
                        ? 'bg-white/20 border-white/60 text-white shadow-lg'
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/15 cursor-pointer'
                )}
                whileHover={!isMatched ? { scale: 1.01 } : {}}
                whileTap={!isMatched ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center gap-2">
                  {isMatched && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                  <span>{pair.left}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Right column */}
        <div className={cn('flex flex-col gap-2', isMobile ? 'w-full' : 'w-1/2')}>
          <span className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mb-1">
            {isFr ? 'Définitions' : 'Definitions'}
          </span>
          {shuffledRight.map((rightVal, idx) => {
            const isUsed = matchedRights.has(rightVal);
            const isWrong = wrongPair?.right === rightVal;
            return (
              <motion.button
                key={idx}
                onClick={() => handleRightClick(rightVal)}
                disabled={isUsed || selectedLeft === null}
                className={cn(
                  'text-left rounded-xl px-4 py-3 text-sm font-medium border-2 transition-all',
                  isUsed
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200/50'
                    : isWrong
                      ? 'bg-red-500/20 border-red-400 text-white'
                      : selectedLeft !== null && !isUsed
                        ? 'bg-white/95 text-slate-800 border-white/80 hover:bg-white cursor-pointer shadow-lg'
                        : 'bg-white/10 border-white/20 text-white/60'
                )}
                whileHover={selectedLeft !== null && !isUsed ? { scale: 1.01 } : {}}
                whileTap={selectedLeft !== null && !isUsed ? { scale: 0.98 } : {}}
              >
                {rightVal}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-white/10 px-5 py-2.5 flex items-center justify-between">
        {completed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-medium flex items-center gap-2 text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isFr ? 'Parfait ! Tout est associé ! 🎉' : 'Perfect! All matched! 🎉'}
          </motion.div>
        ) : (
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
            {selectedLeft !== null
              ? (isFr ? 'Maintenant choisissez la correspondance →' : 'Now pick the match →')
              : (isFr ? 'Sélectionnez un terme à gauche' : 'Select a term on the left')}
          </span>
        )}
        {completed && gamificationEnabled && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
          >
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">+1</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
