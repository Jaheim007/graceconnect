import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

/**
 * BackToTopProgress — Circular progress button that shows scroll position
 * and scrolls to top on click. Replaces the basic ScrollToTop.
 */
export function BackToTopProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = main;
      const max = scrollHeight - clientHeight;
      if (max <= 0) { setProgress(0); setVisible(false); return; }
      const pct = scrollTop / max;
      setProgress(pct);
      setVisible(scrollTop > 300);
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const main = document.getElementById('main-content');
    main?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-40 h-10 w-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors md:bottom-6"
          aria-label="Retour en haut"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
            <circle
              cx="20" cy="20" r="18" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
          <ArrowUp className="h-4 w-4 text-foreground relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
