import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target?: number;
  value?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  duration?: number;
}

export function AnimatedCounter({ target, value, prefix = '', suffix = '', label, duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);
  const finalValue = target ?? value ?? 0;

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = finalValue;
    const step = Math.max(1, Math.floor(end / (duration * 60)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [isInView, finalValue, duration]);

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : count.toLocaleString('fr-FR');

  // Inline mode (no label) — used in hero
  if (!label) {
    return <span ref={ref as any}>{prefix}{formatted}{suffix}</span>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center"
    >
      <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary">
        {prefix}{formatted}{suffix}
      </p>
      <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
    </motion.div>
  );
}
