import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LazyLoadSectionProps {
  children: ReactNode;
  className?: string;
  /** Fallback height while loading */
  fallbackHeight?: string;
  /** Root margin for intersection observer */
  rootMargin?: string;
}

/**
 * LazyLoadSection — Defers rendering of heavy sections until they
 * are near the viewport, improving initial page load performance.
 */
export function LazyLoadSection({
  children,
  className,
  fallbackHeight = '200px',
  rootMargin = '200px',
}: LazyLoadSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {inView ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      ) : (
        <div style={{ minHeight: fallbackHeight }} />
      )}
    </div>
  );
}
