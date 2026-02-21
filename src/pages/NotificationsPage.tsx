import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { db } from '@/lib/db';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: notifs = [], isLoading } = useNotifications(user?.id);

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

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm flex-1">Notifications</span>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground">
            <CheckCheck className="h-3.5 w-3.5" /> Tout marquer lu
          </Button>
        )}
      </div>

      <div className="container max-w-2xl py-5">
        {unreadCount > 0 && (
          <p className="text-xs text-muted-foreground mb-4">{unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}</p>
        )}

        {isLoading ? <SkeletonRow count={5} /> : notifs.length === 0 ? (
          <EmptyState variant="generic" title="Aucune notification" description="Vous êtes à jour ! 🎉" />
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                  n.is_read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5 hover:bg-primary/8'
                )}
              >
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', n.is_read ? 'bg-muted' : 'gold-gradient shadow-gold')}>
                  <Bell className={cn('h-4 w-4', n.is_read ? 'text-muted-foreground' : 'text-primary-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium leading-snug', !n.is_read && 'text-foreground')}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
