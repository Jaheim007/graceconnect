import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_DURATION = 2800; // total animation time in ms
const SESSION_KEY = 'sv_splash_shown';

/**
 * SplashScreen — Cinematic logo reveal animation inspired by modern brand intros.
 * Shows once per session, then auto-dismisses.
 */
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('exit'), SPLASH_DURATION - 600);
    const t3 = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      onComplete();
    }, SPLASH_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'exit' ? null : null}
      <motion.div
        key="splash"
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{ background: 'hsl(var(--background))' }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        animate={phase === 'exit' ? { opacity: 0, scale: 1.1 } : { opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Animated background particles / glow */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Radial glow behind logo */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />
          {/* Rotating ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-primary/20"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: [0, 3, 4], opacity: [0, 0.5, 0], rotate: 180 }}
            transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
          />
          {/* Second ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-primary/10"
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{ scale: [0, 2.5, 3.5], opacity: [0, 0.3, 0], rotate: -90 }}
            transition={{ duration: 1.8, ease: 'easeOut', delay: 0.5 }}
          />
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
              style={{
                top: `${30 + Math.random() * 40}%`,
                left: `${30 + Math.random() * 40}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 0.8, 0],
                y: [0, -60 - Math.random() * 40],
                x: [(Math.random() - 0.5) * 80],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
                delay: 0.6 + i * 0.12,
              }}
            />
          ))}
        </div>

        {/* Main content: Logo + Text */}
        <div className="relative flex flex-col items-center gap-5">
          {/* Logo container with reveal */}
          <motion.div
            className="relative"
            initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1], // custom spring-like ease
              delay: 0.1,
            }}
          >
            {/* Glow behind the logo */}
            <motion.div
              className="absolute inset-0 rounded-2xl blur-2xl"
              style={{ background: 'hsl(var(--primary) / 0.3)' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.6, 0.3], scale: [0.5, 1.3, 1.1] }}
              transition={{ duration: 1.2, delay: 0.3 }}
            />
            <img
              src="/logo-s.png"
              alt=""
              className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-lg"
              style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.4))' }}
            />
          </motion.div>

          {/* Brand name with staggered letter reveal */}
          <div className="flex items-center overflow-hidden">
            {'SiteViral'.split('').map((letter, i) => (
              <motion.span
                key={i}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
                style={{
                  color: i < 4 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
                initial={{ y: 40, opacity: 0, rotateX: -90 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.5 + i * 0.06,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Tagline slide-up */}
          <motion.p
            className="text-sm sm:text-base text-muted-foreground font-medium tracking-wide"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2, ease: 'easeOut' }}
          >
            Écris. Vends. Gagne.
          </motion.p>

          {/* Underline swoosh */}
          <motion.div
            className="h-0.5 rounded-full bg-primary"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 120, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Returns true if the splash has already been shown this session */
export function wasSplashShown(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
