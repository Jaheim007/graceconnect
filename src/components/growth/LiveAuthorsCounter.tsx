import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function LiveAuthorsCounter() {
  const [count, setCount] = useState(0);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDate();
      const month = now.getMonth();

      const hourWeight = Math.max(0.3, Math.sin((hour - 3) * Math.PI / 20));
      const dayNoise = Math.sin(day * 13.7 + month * 41.3) * 25;
      const minuteNoise = Math.sin(minute * 7.1 + hour * 3.3) * 15 + Math.cos(minute * 2.7) * 10;

      const base = 85;
      const result = Math.round(base * hourWeight + dayNoise + minuteNoise + 60);
      setCount(Math.max(37, Math.min(193, result)));
    };

    compute();
    const interval = setInterval(compute, 45000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex items-center justify-center gap-2 py-3"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <PenTool className="h-3.5 w-3.5 text-primary" />
      <p className="text-xs font-medium text-muted-foreground">
        <span className="font-bold text-foreground tabular-nums">{count}</span>{' '}
        {isFr ? 'auteurs créent leur livre en ce moment' : 'authors are writing their book right now'}
      </p>
    </motion.div>
  );
}
