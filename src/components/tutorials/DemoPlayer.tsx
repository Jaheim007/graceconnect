import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

export interface DemoScene {
  /** Short caption shown under the frame, like a voice-over line. */
  caption: string;
  /** Seconds the scene stays on screen. */
  duration?: number;
  render: () => React.ReactNode;
}

interface DemoPlayerProps {
  scenes: DemoScene[];
  title?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Frame-by-frame "video" player built from real dashboard UI mocks.
 * Placeholder for real screen recordings — same pedagogy, zero hosting.
 */
export function DemoPlayer({ scenes, title, autoPlay = false, className }: DemoPlayerProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const durations = useMemo(() => scenes.map((s) => (s.duration ?? 4) * 1000), [scenes]);

  const goTo = useCallback((next: number) => {
    setIndex(((next % scenes.length) + scenes.length) % scenes.length);
    setProgress(0);
    startRef.current = performance.now();
  }, [scenes.length]);

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now();
    const total = durations[index] ?? 4000;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(1, elapsed / total);
      setProgress(pct);
      if (pct >= 1) {
        setIndex((i) => (i + 1) % scenes.length);
        setProgress(0);
        startRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, index, durations, scenes.length]);

  const scene = scenes[index];
  if (!scene) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Frame */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-muted/40 via-background to-muted/20 p-3 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative"
          >
            {scene.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Caption */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {index + 1}
        </span>
        <p className="text-xs leading-relaxed text-foreground">{scene.caption}</p>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? (isFr ? 'Pause' : 'Pause') : (isFr ? 'Lecture' : 'Play')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <div className="flex flex-1 items-center gap-1">
          {scenes.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${isFr ? 'Étape' : 'Step'} ${i + 1}`}
              className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100"
                style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }}
              />
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={isFr ? 'Étape précédente' : 'Previous step'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={isFr ? 'Étape suivante' : 'Next step'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { goTo(0); setPlaying(true); }}
            aria-label={isFr ? 'Recommencer' : 'Restart'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {title && (
        <p className="text-[10px] text-muted-foreground">
          {isFr
            ? `Démo interactive — ${title}. Les vidéos filmées arrivent bientôt.`
            : `Interactive demo — ${title}. Recorded videos coming soon.`}
        </p>
      )}
    </div>
  );
}
