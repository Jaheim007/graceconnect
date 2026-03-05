import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * ReadingProgressBar — Thin animated bar at the top of the viewport
 * showing how far the user has scrolled through the page.
 */
export function ReadingProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = main;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) { setScrollProgress(0); return; }
      setScrollProgress(Math.min(scrollTop / maxScroll, 1));
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  const springProgress = useSpring(scrollProgress, { stiffness: 200, damping: 30 });
  const scaleX = useTransform(springProgress, [0, 1], [0, 1]);

  if (scrollProgress === 0) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-50 origin-left bg-primary"
      style={{ scaleX }}
    />
  );
}
