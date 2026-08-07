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

  const formatted = count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : count.toLocaleString();

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

// Animated text highlights for landing page
import { Zap, Shield, Globe } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
// Stats are fetched from DB to avoid fake/misleading numbers
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats-landing'],
    queryFn: async () => {
      const [{ count: orgCount }, { count: productCount }] = await Promise.all([
        db.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('is_published', true),
      ]);
      return { orgs: orgCount || 0, products: productCount || 0 };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function StatsBar({ locale: localeProp }: { locale?: string } = {}) {
  const { locale: ctxLocale } = useI18n();
  const isFr = (localeProp || ctxLocale) === 'fr';
  const { data: stats } = usePlatformStats();

  const VALUE_PROPS = isFr ? [
    { target: stats?.products || 0, suffix: '+', label: 'Ressources', desc: 'E-books, formations, guides, audio…', icon:  },
    { target: stats?.orgs || 0, suffix: '+', label: 'Créateurs', desc: 'Leaders, formateurs, organisations', icon: <Globe className="h-5 w-5" /> },
    { target: 0, prefix: '', suffix: '', label: 'Gratuit pour commencer', desc: 'Aucun abonnement requis', icon: <Zap className="h-5 w-5" /> },
    { target: 46, suffix: '+', label: 'Pays couverts', desc: 'Mobile Money, Carte, Stripe, Paystack', icon: <Shield className="h-5 w-5" /> },
  ] : [
    { target: stats?.products || 0, suffix: '+', label: 'Resources', desc: 'E-books, courses, guides, audio…', icon:  },
    { target: stats?.orgs || 0, suffix: '+', label: 'Creators', desc: 'Leaders, trainers, organizations', icon: <Globe className="h-5 w-5" /> },
    { target: 0, prefix: '', suffix: '', label: 'Free to start', desc: 'No subscription required', icon: <Zap className="h-5 w-5" /> },
    { target: 46, suffix: '+', label: 'Countries covered', desc: 'Mobile Money, Card, Stripe, Paystack', icon: <Shield className="h-5 w-5" /> },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30 border-y border-border/40">
      <div className="container max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {VALUE_PROPS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
              className="text-center space-y-3"
            >
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {s.icon}
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tabular-nums">
                <AnimatedCounter target={s.target} prefix={s.prefix} suffix={s.suffix} duration={2.5} />
              </div>
              <p className="text-sm sm:text-base font-bold text-foreground">{s.label}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
