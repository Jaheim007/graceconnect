import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (n: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 1200,
  prefix = '',
  suffix = '',
  className,
  formatter,
}: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayed(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();

    function animate() {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [value, duration]);

  const formatted = formatter ? formatter(displayed) : displayed.toLocaleString();

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
