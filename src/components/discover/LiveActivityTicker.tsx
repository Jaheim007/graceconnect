import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Flame, X } from 'lucide-react';

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

/**
 * LiveActivityTicker — shows ONLY real platform activity.
 * Synthetic/fake activities removed per audit C2 (no fake data).
 */
export function LiveActivityTicker() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosed, setIsClosed] = useState(() => {
    try {
      return localStorage.getItem('live-ticker-closed') === 'true';
    } catch {
      return false;
    }
  });

  const handleClose = () => {
    setIsClosed(true);
    try {
      localStorage.setItem('live-ticker-closed', 'true');
    } catch {
      // Silent fail
    }
  };

  const { data: activities = [] } = useQuery({
    queryKey: ['live-activity-ticker', locale],
    queryFn: async () => {
      const results: Activity[] = [];

      // Real purchases (anonymized)
      const { data: purchases } = await db
        .from('product_purchases')
        .select('id, created_at, digital_products(title, organizations(name))')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(15);

      if (purchases) {
        for (const p of purchases) {
          const prod = (p as any).digital_products?.title;
          const org = (p as any).digital_products?.organizations?.name;
          if (prod && org) {
            results.push({
              id: `purchase-${p.id}`,
              icon: <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
              text: isFr ? `Quelqu'un a acheté « ${prod} »` : `Someone purchased "${prod}"`,
              time: timeAgo(p.created_at!, isFr),
            });
          }
        }
      }

      // Real new products
      const { data: newProducts } = await db
        .from('digital_products')
        .select('id, created_at, title, organizations(name)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (newProducts) {
        for (const p of newProducts) {
          const org = (p as any).organizations?.name;
          if (org) {
            results.push({
              id: `new-${p.id}`,
              icon: <Flame className="h-3.5 w-3.5 text-orange-500" />,
              text: isFr ? `${org} a ajouté « ${p.title} »` : `${org} added "${p.title}"`,
              time: timeAgo(p.created_at!, isFr),
            });
          }
        }
      }

      // Real new orgs
      const { data: newOrgs } = await db
        .from('organizations')
        .select('id, created_at, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (newOrgs) {
        for (const o of newOrgs) {
          results.push({
            id: `org-${o.id}`,
            icon: <UserPlus className="h-3.5 w-3.5 text-blue-500" />,
            text: isFr ? `${o.name} a rejoint la plateforme` : `${o.name} joined the platform`,
            time: timeAgo(o.created_at!, isFr),
          });
        }
      }

      // Shuffle real activities
      for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
      }

      return results;
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (activities.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-5 py-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Live
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2.5 min-w-0 flex-1"
          >
            {current?.icon}
            <span className="text-sm font-medium truncate">{current?.text}</span>
            <span className="text-xs text-muted-foreground shrink-0">{current?.time}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
