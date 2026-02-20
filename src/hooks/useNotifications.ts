import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { UserNotification } from '@/types/database';

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await db
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as UserNotification[];
    },
    enabled: !!userId,
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['unread-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count } = await db
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}
