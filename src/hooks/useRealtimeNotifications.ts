import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that subscribes to Supabase Realtime channels for:
 * - New messages in organizations the user belongs to
 * - New notifications for the user
 */
export function useRealtimeNotifications(orgIds: string[]) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleNewMessage = useCallback(
    (payload: any) => {
      // Don't notify for own messages
      if (payload.new?.sender_id === user?.id) return;
      qc.invalidateQueries({ queryKey: ['org-messages', payload.new?.organization_id] });
      toast({
        title: '💬 Nouveau message',
        description: 'Un nouveau message a été envoyé dans votre communauté.',
      });
    },
    [user?.id, qc, toast]
  );

  const handleNewNotification = useCallback(
    (payload: any) => {
      if (payload.new?.user_id !== user?.id) return;
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      toast({
        title: payload.new?.title || '🔔 Notification',
        description: payload.new?.body?.slice(0, 80),
      });
    },
    [user?.id, qc, toast]
  );

  useEffect(() => {
    if (!user || orgIds.length === 0) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to messages for each org
    for (const orgId of orgIds.slice(0, 5)) {
      const channel = supabase
        .channel(`org-messages-${orgId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'org_messages',
            filter: `organization_id=eq.${orgId}`,
          },
          handleNewMessage
        )
        .subscribe();
      channels.push(channel);
    }

    // Subscribe to user notifications
    const notifChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        handleNewNotification
      )
      .subscribe();
    channels.push(notifChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [user?.id, orgIds.join(','), handleNewMessage, handleNewNotification]);
}
