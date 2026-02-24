import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Announcement } from '@/types/database';

export function useOrgAnnouncements(orgId: string | undefined, publishedOnly = true) {
  return useQuery({
    queryKey: ['org-announcements', orgId, publishedOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('announcements')
        .select('*')
        .eq('organization_id', orgId)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (publishedOnly) q = q.eq('is_published', true);
      const { data } = await q;
      return (data || []) as Announcement[];
    },
    enabled: !!orgId,
  });
}

export function useFeedAnnouncements(orgIds: string[]) {
  return useQuery({
    queryKey: ['feed-announcements', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await db
        .from('announcements')
        .select('*, organizations(name, slug)')
        .in('organization_id', orgIds)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(20);
      return (data || []).map((a: any) => ({
        ...a,
        organization_name: a.organizations?.name,
        organization_slug: a.organizations?.slug,
      })) as Announcement[];
    },
    enabled: orgIds.length > 0,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Announcement>) => {
      const { data, error } = await db.from('announcements').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<Announcement>) => {
      qc.invalidateQueries({ queryKey: ['org-announcements', vars.organization_id] });
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Announcement> }) => {
      const { data, error } = await db
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: Announcement) => {
      qc.invalidateQueries({ queryKey: ['org-announcements', data.organization_id] });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await db.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return orgId;
    },
    onSuccess: (orgId: string) => {
      qc.invalidateQueries({ queryKey: ['org-announcements', orgId] });
    },
  });
}
