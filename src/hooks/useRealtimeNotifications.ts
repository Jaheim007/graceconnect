import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that subscribes to Supabase Realtime channels for:
 * - New notifications for the user
 */
export function useRealtimeNotifications(orgIds: string[]) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

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
    if (!user) return;

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

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user?.id, handleNewNotification]);
}
