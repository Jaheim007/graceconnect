import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle2, XCircle, Zap, PenLine } from 'lucide-react';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';

export interface FillInBlankData {
  sentence: string; // e.g. "The ___ is the powerhouse of the cell"
  answer: string;   // "mitochondria"
  hint?: string;
  acceptableAnswers?: string[]; // alternative correct answers
}

interface FillInBlankSlideProps {
  fillInBlank: FillInBlankData;
  theme: SlideTheme;
  slideIndex: number;
  totalSlides: number;
  lessonTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  onStarEarned?: () => void;
  gamificationEnabled?: boolean;
}

function ConfettiBurst() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 250,
    y: (Math.random() - 0.5) * 250 - 80,
    rotation: Math.random() * 720,
    scale: 0.4 + Math.random() * 0.7,
    color: ['#FFD700', '#FF6B35', '#00D4AA', '#FF3366', '#7B61FF'][i % 5],
    delay: Math.random() * 0.12,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale, rotate: p.rotation }}
          transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
          style={{ backgroundColor: p.color }}
          className="absolute w-2.5 h-2.5 rounded-sm"
        />
      ))}
    </div>
  );
}

export function FillInBlankSlide({
  fillInBlank,
  theme,
  slideIndex,
  totalSlides,
  lessonTitle,
  orgLogoUrl,
  deviceMode,
  onStarEarned,
  gamificationEnabled = true,
}: FillInBlankSlideProps) {
  const [userInput, setUserInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isMobile = deviceMode === 'mobile';

  const allAcceptable = [
    fillInBlank.answer.toLowerCase().trim(),
    ...(fillInBlank.acceptableAnswers || []).map(a => a.toLowerCase().trim()),
  ];

  const isCorrect = allAcceptable.includes(userInput.toLowerCase().trim());

  const handleSubmit = () => {
    if (revealed || !userInput.trim()) return;
    setRevealed(true);
    if (isCorrect) {
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

  // Split sentence at ___
  const parts = fillInBlank.sentence.split(/___+/);

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <SlideDecoration theme={theme} />
      {showConfetti && <ConfettiBurst />}

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            <PenLine className="h-3.5 w-3.5" />
          </div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{lessonTitle}</span>
        <span className="text-[10px] bg-white/15 rounded-full px-2.5 py-0.5 text-white/80 font-medium">
          {slideIndex + 1} / {totalSlides}
        </span>
      </div>

      {/* Star reward */}
      <AnimatePresence>
        {revealed && isCorrect && gamificationEnabled && (
          <motion.div
            initial={{ scale: 0, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, delay: 0.3 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-2"
          >
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-yellow-300 font-bold">+1 ⭐</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={cn('flex-1 flex flex-col items-center justify-center relative z-10 px-6 gap-6')}>
        <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Fill in the blank</span>
        </motion.div>

        {/* Sentence with blank */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn('text-center font-semibold leading-relaxed max-w-lg', isMobile ? 'text-lg' : 'text-xl')}
        >
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                revealed ? (
                  <span className={cn(
                    'inline-block mx-1 px-3 py-0.5 rounded-lg font-bold border-b-2',
                    isCorrect
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                      : 'bg-red-500/30 border-red-400 text-red-300 line-through'
                  )}>
                    {userInput || '___'}
                  </span>
                ) : (
                  <span className="inline-block mx-1 border-b-2 border-dashed border-white/40 min-w-[80px]" />
                )
              )}
            </span>
          ))}
        </motion.div>

        {/* Show correct answer if wrong */}
        {revealed && !isCorrect && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-emerald-400"
          >
            Correct answer: <strong>{fillInBlank.answer}</strong>
          </motion.p>
        )}

        {/* Input */}
        {!revealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 w-full max-w-sm"
          >
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              className="flex-1 bg-white/95 text-slate-800 rounded-xl px-4 py-3 text-sm font-medium border-2 border-white/80 focus:outline-none focus:border-yellow-400 placeholder:text-slate-400"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className={cn(
                'px-5 py-3 rounded-xl text-sm font-bold transition-all',
                userInput.trim()
                  ? 'bg-white text-slate-800 hover:bg-white/90 shadow-lg'
                  : 'bg-white/20 text-white/40 cursor-not-allowed'
              )}
            >
              ✓
            </button>
          </motion.div>
        )}

        {/* Hint */}
        {!revealed && fillInBlank.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
          >
            {showHint ? `💡 ${fillInBlank.hint}` : '💡 Show hint'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-20 border-t border-white/10 px-5 py-2.5 flex items-center justify-between">
        {revealed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('text-xs font-medium flex items-center gap-2', isCorrect ? 'text-emerald-400' : 'text-amber-400')}
          >
            {isCorrect ? (
              <><CheckCircle2 className="h-4 w-4" /> Excellent ! 🎉</>
            ) : (
              <><XCircle className="h-4 w-4" /> Keep learning! 💪</>
            )}
          </motion.div>
        ) : (
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
            Type the missing word
          </span>
        )}
        {revealed && isCorrect && gamificationEnabled && (
          <motion.div className="flex items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.4 }}>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">+1</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
