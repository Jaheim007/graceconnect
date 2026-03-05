import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, Heart, Megaphone, GraduationCap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  { type: 'new_product', icon: ShoppingBag, label: { fr: 'Produits', en: 'Products' }, color: 'text-blue-500' },
  { type: 'purchase', icon: Heart, label: { fr: 'Achats', en: 'Purchases' }, color: 'text-emerald-500' },
  { type: 'new_announcement', icon: Megaphone, label: { fr: 'Annonces', en: 'Announcements' }, color: 'text-amber-500' },
  { type: 'new_program', icon: GraduationCap, label: { fr: 'Formations', en: 'Programs' }, color: 'text-purple-500' },
];

export function NotificationDigest() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();

  const { data: counts } = useQuery({
    queryKey: ['notif-digest', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data } = await db
        .from('user_notifications')
        .select('notification_type')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(100);

      const map: Record<string, number> = {};
      for (const n of data || []) {
        const t = n.notification_type || 'other';
        map[t] = (map[t] || 0) + 1;
      }
      return map;
    },
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (!user || !counts) return null;
  const totalUnread = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalUnread === 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate('/notifications')}
      className="w-full rounded-xl border border-border bg-card p-3 mb-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left group"
    >
      <div className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">
          {totalUnread} {isFr ? 'notification' : 'notification'}{totalUnread > 1 ? 's' : ''} {isFr ? 'non lue' : 'unread'}{totalUnread > 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 mt-1 flex-wrap">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.type] || 0;
            if (count === 0) return null;
            const Icon = cat.icon;
            return (
              <Badge key={cat.type} variant="outline" className="text-[9px] gap-0.5 py-0 h-4">
                <Icon className={`h-2.5 w-2.5 ${cat.color}`} />
                {count}
              </Badge>
            );
          })}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </motion.button>
  );
}
