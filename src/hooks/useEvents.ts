import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Event } from '@/types/database';

export function useOrgEvents(orgId: string | undefined, publishedOnly = true) {
  return useQuery({
    queryKey: ['org-events', orgId, publishedOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('events')
        .select('*')
        .eq('organization_id', orgId)
        .order('event_date', { ascending: true });
      if (publishedOnly) q = q.eq('is_published', true);
      const { data } = await q;
      return (data || []) as Event[];
    },
    enabled: !!orgId,
  });
}

export function useFeedEvents(orgIds: string[]) {
  return useQuery({
    queryKey: ['feed-events', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const now = new Date().toISOString();
      const { data } = await db
        .from('events')
        .select('*')
        .in('organization_id', orgIds)
        .eq('is_published', true)
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(10);
      return (data || []) as Event[];
    },
    enabled: orgIds.length > 0,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Event>) => {
      const { data, error } = await db.from('events').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<Event>) => {
      qc.invalidateQueries({ queryKey: ['org-events', vars.organization_id] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Event> }) => {
      const { data, error } = await db
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: Event) => {
      qc.invalidateQueries({ queryKey: ['org-events', data.organization_id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await db.from('events').delete().eq('id', id);
      if (error) throw error;
      return orgId;
    },
    onSuccess: (orgId: string) => {
      qc.invalidateQueries({ queryKey: ['org-events', orgId] });
    },
  });
}
