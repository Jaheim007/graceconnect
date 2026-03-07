import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, BookOpen, Share2, Users, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';

interface ActivityItem {
  id: string;
  type: 'purchase' | 'donation' | 'signup' | 'publish';
  message: string;
  icon: typeof ShoppingBag;
  color: string;
  time: string;
}

const ACTIVITY_ICONS = {
  purchase: { icon: ShoppingBag, color: 'text-primary bg-primary/10' },
  donation: { icon: Heart, color: 'text-rose-500 bg-rose-500/10' },
  signup: { icon: Users, color: 'text-blue-500 bg-blue-500/10' },
  publish: { icon: BookOpen, color: 'text-purple-500 bg-purple-500/10' },
};

function anonymize(name?: string): string {
  if (!name) return 'Quelqu\'un';
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return name.length > 3 ? `${name.slice(0, 3)}***` : name;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

interface LiveActivityFeedProps {
  className?: string;
  limit?: number;
}

/**
 * LiveActivityFeed — shows real-time platform activity as social proof
 */
export function LiveActivityFeed({ className, limit = 5 }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [visible, setVisible] = useState(0);

  const fetchActivity = useCallback(async () => {
    try {
      const [purchases, donations] = await Promise.all([
        db.from('product_purchases')
          .select('id, created_at, buyer_name, digital_products(title)')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(limit),
        db.from('donations')
          .select('id, created_at, donor_name, donation_campaigns(title)')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const items: ActivityItem[] = [];

      (purchases.data || []).forEach((p: any) => {
        items.push({
          id: `p-${p.id}`,
          type: 'purchase',
          message: `${anonymize(p.buyer_name)} a acheté « ${p.digital_products?.title || 'un produit'} »`,
          icon: ACTIVITY_ICONS.purchase.icon,
          color: ACTIVITY_ICONS.purchase.color,
          time: p.created_at,
        });
      });

      (donations.data || []).forEach((d: any) => {
        items.push({
          id: `d-${d.id}`,
          type: 'donation',
          message: `${anonymize(d.donor_name)} a soutenu « ${d.donation_campaigns?.title || 'une campagne'} »`,
          icon: ACTIVITY_ICONS.donation.icon,
          color: ACTIVITY_ICONS.donation.color,
          time: d.created_at,
        });
      });

      // Sort by time desc
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(items.slice(0, limit));
    } catch {
      // Silent fail — social proof is non-critical
    }
  }, [limit]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Stagger display
  useEffect(() => {
    if (activities.length === 0) return;
    const timer = setInterval(() => {
      setVisible(v => Math.min(v + 1, activities.length));
    }, 300);
    return () => clearInterval(timer);
  }, [activities.length]);

  if (activities.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Activité récente</h3>
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      <div className="space-y-1.5">
        <AnimatePresence>
          {activities.slice(0, visible).map((activity, i) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50"
              >
                <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', activity.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs flex-1 min-w-0 truncate">{activity.message}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(activity.time)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
