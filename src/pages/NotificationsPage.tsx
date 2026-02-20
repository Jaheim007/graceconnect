import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { db } from '@/lib/db';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
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
    <div className="container max-w-2xl py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonRow count={5} />
      ) : notifs.length === 0 ? (
        <EmptyState
          variant="generic"
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
                n.is_read
                  ? 'border-border bg-card'
                  : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
              )}
            >
              <div className={cn(
                'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                n.is_read ? 'bg-muted' : 'gold-gradient shadow-gold'
              )}>
                <Bell className={cn('h-4 w-4', n.is_read ? 'text-muted-foreground' : 'text-primary-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', !n.is_read && 'text-foreground')}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.is_read && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
