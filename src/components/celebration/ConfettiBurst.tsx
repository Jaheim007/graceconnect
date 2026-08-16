import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFA07A', '#DDA0DD', '#FFD700', '#87CEEB'];

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isSmallScreen() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth < 640;
}

/**
 * Lightweight one-shot confetti. GPU-friendly (transform + opacity only),
 * unmounts itself when done, and stays off on small screens / reduced motion
 * so low-end phones never pay for it.
 */
export function ConfettiBurst({ pieces = 18, duration = 2.4 }: { pieces?: number; duration?: number }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || isSmallScreen()) return;
    setEnabled(true);
    const t = setTimeout(() => setEnabled(false), (duration + 1.2) * 1000);
    return () => clearTimeout(t);
  }, [duration]);

  const items = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        left: (i / pieces) * 100 + (i % 3) * 2,
        size: 6 + ((i * 3) % 6),
        drift: ((i % 5) - 2) * 22,
        round: i % 2 === 0,
        delay: (i % 6) * 0.08,
      })),
    [pieces],
  );

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block will-change-transform"
          style={{
            left: `${p.left}%`,
            top: -12,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 420, x: p.drift, opacity: [1, 1, 0], rotate: 360 }}
          transition={{ duration, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
