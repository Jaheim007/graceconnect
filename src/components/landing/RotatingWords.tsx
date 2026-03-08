import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface RotatingWordsProps {
  words: string[];
  interval?: number;
  className?: string;
}

/**
 * Cycles through words with a smooth vertical slide animation.
 */
export function RotatingWords({ words, interval = 2500, className = '' }: RotatingWordsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
