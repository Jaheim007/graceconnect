import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export interface NotifPrefs {
  email_enabled: boolean;
  push_enabled: boolean;
  purchases: boolean;
  donations: boolean;
  announcements: boolean;
  events: boolean;
  comments: boolean;
  affiliate: boolean;
  programs: boolean;
  marketing: boolean;
}

const DEFAULTS: NotifPrefs = {
  email_enabled: true, push_enabled: true,
  purchases: true, donations: true, announcements: true, events: true,
  comments: true, affiliate: true, programs: true, marketing: false,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notif-prefs', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULTS;
      const { data } = await db.from('notification_preferences')
        .select('*').eq('user_id', user.id).maybeSingle();
      return data ? (data as unknown as NotifPrefs) : DEFAULTS;
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Partial<NotifPrefs>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await db.from('notification_preferences')
        .select('id').eq('user_id', user.id).maybeSingle();
      if (existing) {
        await db.from('notification_preferences').update({ ...prefs, updated_at: new Date().toISOString() }).eq('user_id', user.id);
      } else {
        await db.from('notification_preferences').insert({ user_id: user.id, ...DEFAULTS, ...prefs });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-prefs', user?.id] });
    },
  });
}
