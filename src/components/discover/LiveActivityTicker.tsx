import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Flame, Eye } from 'lucide-react';

interface Activity {
  id: string;
  icon: React.ReactNode;
  text: string;
  time: string;
}

function timeAgo(dateStr: string, isFr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isFr ? 'à l\'instant' : 'just now';
  if (mins < 60) return isFr ? `il y a ${mins}min` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isFr ? `il y a ${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return isFr ? `il y a ${days}j` : `${days}d ago`;
}

export function LiveActivityTicker() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: activities = [] } = useQuery({
    queryKey: ['live-activity-ticker'],
    queryFn: async () => {
      const results: Activity[] = [];

      // Recent purchases (anonymized - just product name + org)
      const { data: purchases } = await db
        .from('product_purchases')
        .select('id, created_at, digital_products(title), organizations(name)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (purchases) {
        for (const p of purchases) {
          const prod = (p as any).digital_products?.title;
          const org = (p as any).organizations?.name;
          if (prod && org) {
            results.push({
              id: `purchase-${p.id}`,
              icon: <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
              text: isFr
                ? `Quelqu'un a acheté « ${prod} »`
                : `Someone purchased "${prod}"`,
              time: timeAgo(p.created_at!, isFr),
            });
          }
        }
      }

      // Recent new products
      const { data: newProducts } = await db
        .from('digital_products')
        .select('id, created_at, title, organizations(name)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .limit(6);

      if (newProducts) {
        for (const p of newProducts) {
          const org = (p as any).organizations?.name;
          if (org) {
            results.push({
              id: `new-${p.id}`,
              icon: <Flame className="h-3.5 w-3.5 text-orange-500" />,
              text: isFr
                ? `${org} a ajouté « ${p.title} »`
                : `${org} added "${p.title}"`,
              time: timeAgo(p.created_at!, isFr),
            });
          }
        }
      }

      // Recent new orgs (sign of growth)
      const { data: newOrgs } = await db
        .from('organizations')
        .select('id, created_at, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (newOrgs) {
        for (const o of newOrgs) {
          results.push({
            id: `org-${o.id}`,
            icon: <UserPlus className="h-3.5 w-3.5 text-blue-500" />,
            text: isFr
              ? `${o.name} a rejoint la plateforme`
              : `${o.name} joined the platform`,
            time: timeAgo(o.created_at!, isFr),
          });
        }
      }

      // Shuffle for diversity
      for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
      }

      return results;
    },
    staleTime: 60 * 1000,
  });

  // Auto-rotate every 4s
  useEffect(() => {
    if (activities.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Live
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            {current?.icon}
            <span className="text-xs truncate">{current?.text}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{current?.time}</span>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-0.5 shrink-0">
          {activities.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-1 rounded-full transition-colors ${i === currentIndex % 5 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
