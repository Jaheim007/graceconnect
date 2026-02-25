import { Bell, CheckCheck, ArrowLeft, BellRing, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { db } from '@/lib/db';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageTour } from '@/components/onboarding/PageTour';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';

const TOUR_STEPS = [
  { titleKey: 'tour.notifications_1_title', descKey: 'tour.notifications_1_desc', icon: <Bell className="h-4 w-4" /> },
];

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Notifications — Siteviral" noindex />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm flex-1">{t('page.notifications')}</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
            <CheckCheck className="h-3.5 w-3.5" /> {t('page.notifications_mark_all')}
          </Button>
        )}
      </div>

      <div className="container max-w-2xl py-5 space-y-4">
        {/* Push notification toggle */}
        {pushSupported && !pushSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/8 border border-primary/20 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BellRing className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Notifications push</p>
              <p className="text-xs text-muted-foreground">Recevez des alertes même quand l'app est fermée</p>
            </div>
            <Button size="sm" className="bg-primary text-primary-foreground shrink-0" onClick={subscribePush} disabled={pushLoading}>
              {pushLoading ? '...' : 'Activer'}
            </Button>
          </motion.div>
        )}

        <p className="text-xs sm:text-sm text-muted-foreground">{t('page.notifications_desc')}</p>

        <PageTour pageId="notifications" steps={TOUR_STEPS} />

        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs text-muted-foreground">
              {t('page.notifications_unread').replace('{count}', String(unreadCount))}
            </p>
          </div>
        )}

        {isLoading ? <SkeletonRow count={5} /> : visibleNotifs.length === 0 ? (
          <EmptyState variant="generic" title={t('page.notifications_empty')} description={t('page.notifications_empty_desc')} />
        ) : (
          <div className="space-y-5">
            {grouped.map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">{dateLabel}</p>
                <AnimatePresence mode="popLayout">
                  {items.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                      className={cn(
                        'group flex items-start gap-3 p-3.5 rounded-xl border transition-all',
                        n.is_read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
                      )}
                    >
                      <div
                        onClick={() => {
                          if (!n.is_read) markRead(n.id);
                          if (n.action_url) navigate(n.action_url);
                        }}
                        className={cn(
                          'h-9 w-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105',
                          n.is_read ? 'bg-muted' : 'bg-primary'
                        )}
                      >
                        <Bell className={cn('h-4 w-4', n.is_read ? 'text-muted-foreground' : 'text-primary-foreground')} />
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          if (!n.is_read) markRead(n.id);
                          if (n.action_url) navigate(n.action_url);
                        }}
                      >
                        <p className={cn('text-sm font-medium leading-snug', !n.is_read && 'text-foreground')}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(n.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => dismissNotif(n.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
