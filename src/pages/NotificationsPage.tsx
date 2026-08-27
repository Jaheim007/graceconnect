import { Bell, CheckCheck, ArrowLeft, BellRing, Settings2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { db } from '@/lib/db';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useNavigate } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { DeniedInstructions } from '@/components/notifications/DeniedInstructions';

function groupByDate(notifs: any[], locale: string) {
  const groups: Record<string, any[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifs) {
    const d = new Date(n.created_at).toDateString();
    let label: string;
    if (d === today) label = locale === 'fr' ? "Aujourd'hui" : 'Today';
    else if (d === yesterday) label = locale === 'fr' ? 'Hier' : 'Yesterday';
    else label = new Date(n.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return Object.entries(groups);
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { data: notifs = [], isLoading } = useNotifications(user?.id);
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: subscribePush, loading: pushLoading } = usePushNotifications();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visibleNotifs = useMemo(() => notifs.filter(n => !dismissed.has(n.id)), [notifs, dismissed]);
  const grouped = useMemo(() => groupByDate(visibleNotifs, locale), [visibleNotifs, locale]);

  const markAllRead = async () => {
    if (!user) return;
    await db.from('user_notifications').update({ is_read: true }).eq('user_id', user.id);
    qc.invalidateQueries({ queryKey: ['notifications', user.id] });
    qc.invalidateQueries({ queryKey: ['unread-count', user.id] });
  };

  const markRead = async (id: string) => {
    await db.from('user_notifications').update({ is_read: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
    qc.invalidateQueries({ queryKey: ['unread-count', user?.id] });
  };

  const dismissNotif = async (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    await db.from('user_notifications').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
    qc.invalidateQueries({ queryKey: ['unread-count', user?.id] });
  };

  const unreadCount = visibleNotifs.filter((n) => !n.is_read).length;
  const listed = filter === 'unread' ? visibleNotifs.filter((n) => !n.is_read) : visibleNotifs;
  const groupedList = useMemo(() => groupByDate(listed, locale), [listed, locale]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Notifications — Siteviral" noindex />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_0%_0%,hsl(var(--primary)/0.16),transparent_65%)]"
        />
        <div className="relative container max-w-xl px-4 pt-4 pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight">{t('page.notifications')}</h1>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} ${locale === 'fr' ? 'non lue' : 'unread'}${unreadCount > 1 ? 's' : ''}`
                  : locale === 'fr' ? 'Tout est à jour' : 'All caught up'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-muted-foreground"
              aria-label={locale === 'fr' ? 'Préférences' : 'Preferences'}
              onClick={() => navigate('/notification-preferences')}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters + mark all */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/70 p-1 backdrop-blur">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-bold transition-colors',
                    filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'all'
                    ? (locale === 'fr' ? 'Toutes' : 'All')
                    : `${locale === 'fr' ? 'Non lues' : 'Unread'}${unreadCount ? ` · ${unreadCount}` : ''}`}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="ml-auto h-8 gap-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground">
                <CheckCheck className="h-3.5 w-3.5" /> {t('page.notifications_mark_all')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-xl py-4 space-y-4">
        {/* Push notification banner */}
        {pushSupported && !pushSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-2xl p-4 flex flex-col gap-3 border',
              typeof Notification !== 'undefined' && Notification.permission === 'denied'
                ? 'bg-destructive/8 border-destructive/20'
                : 'bg-primary/5 border-primary/15'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Notifications push</p>
                <p className="text-xs text-muted-foreground">Recevez des alertes même quand l'app est fermée</p>
              </div>
              <Button size="sm" className="bg-primary text-primary-foreground shrink-0 rounded-full" onClick={subscribePush} disabled={pushLoading}>
                {pushLoading ? '...' : 'Activer'}
              </Button>
            </div>
            {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
              <DeniedInstructions />
            )}
          </motion.div>
        )}

        {/* Notification list */}
        {isLoading ? <SkeletonRow count={5} /> : listed.length === 0 ? (
          <EmptyState
            variant="generic"
            title={filter === 'unread' ? (locale === 'fr' ? 'Aucune non lue' : 'Nothing unread') : t('page.notifications_empty')}
            description={t('page.notifications_empty_desc')}
          />
        ) : (
          <div className="space-y-5">
            {groupedList.map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{dateLabel}</p>
                  <span className="h-px flex-1 bg-border/60" />
                  <span className="text-[11px] font-semibold text-muted-foreground/70">{items.length}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        locale={locale}
                        onMarkRead={markRead}
                        onDismiss={dismissNotif}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
