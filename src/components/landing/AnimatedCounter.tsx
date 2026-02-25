import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  target?: number;
  value?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  duration?: number;
  icon?: React.ReactNode;
}

export function AnimatedCounter({ target, value, prefix = '', suffix = '', label, duration = 2, icon }: AnimatedCounterProps) {
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
      className="text-center space-y-2"
    >
      {icon && (
        <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
      )}
      <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tabular-nums">
        {prefix}{formatted}{suffix}
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
    </motion.div>
  );
}

// Full stats bar for landing page
import { ShoppingBag, Users, Globe, TrendingUp } from 'lucide-react';

const STATS = [
  { target: 15000, suffix: '+', label: 'Ressources vendues', icon: <ShoppingBag className="h-4 w-4" /> },
  { target: 8500, suffix: '+', label: 'Créateurs actifs', icon: <Users className="h-4 w-4" /> },
  { target: 25, suffix: '+', label: 'Pays couverts', icon: <Globe className="h-4 w-4" /> },
  { target: 98, suffix: '%', label: 'Taux de satisfaction', icon: <TrendingUp className="h-4 w-4" /> },
];

export function StatsBar() {
  return (
    <section className="py-16 px-4 bg-muted/30 border-y border-border/40">
      <div className="container max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <AnimatedCounter key={s.label} target={s.target} suffix={s.suffix} label={s.label} icon={s.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}
