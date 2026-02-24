// Waitlist management hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

export function useWaitlists(orgId: string | undefined) {
  return useQuery({
    queryKey: ['waitlists', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('waitlists')
        .select('*, waitlist_entries(count)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useWaitlistEntries(waitlistId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist-entries', waitlistId],
    queryFn: async () => {
      if (!waitlistId) return [];
      const { data } = await db.from('waitlist_entries')
        .select('*')
        .eq('waitlist_id', waitlistId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!waitlistId,
  });
}

export function useCreateWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: { organization_id: string; title: string; description?: string; product_id?: string; launch_date?: string }) => {
      const { data, error } = await db.from('waitlists').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['waitlists', vars.organization_id] }),
  });
}

export function useJoinWaitlist() {
  return useMutation({
    mutationFn: async (values: { waitlist_id: string; email: string; name?: string }) => {
      const { error } = await db.from('waitlist_entries').upsert(values, { onConflict: 'waitlist_id,email' });
      if (error) throw error;
    },
  });
}
