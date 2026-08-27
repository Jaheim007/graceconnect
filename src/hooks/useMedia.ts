import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { MediaContent } from '@/types/database';

export function useOrgMedia(orgId: string | undefined, publishedOnly = true) {
  return useQuery({
    queryKey: ['org-media', orgId, publishedOnly],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db
        .from('media_content')
        .select('*')
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (publishedOnly) q = q.eq('is_published', true);
      const { data } = await q;
      return (data || []) as MediaContent[];
    },
    enabled: !!orgId,
  });
}

export function useFeedMedia(orgIds: string[]) {
  return useQuery({
    queryKey: ['feed-media', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const { data } = await db
        .from('media_content')
        .select('*')
        .in('organization_id', orgIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);
      return (data || []) as MediaContent[];
    },
    enabled: orgIds.length > 0,
  });
}

export function useMediaById(id: string | undefined) {
  return useQuery({
    queryKey: ['media-by-id', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db
        .from('media_content')
        .select('*')
        .eq('id', id)
        .single();
      return data as MediaContent | null;
    },
    enabled: !!id,
  });
}

export function useCreateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MediaContent>) => {
      const { data, error } = await db.from('media_content').insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_: unknown, vars: Partial<MediaContent>) => {
      qc.invalidateQueries({ queryKey: ['org-media', vars.organization_id] });
    },
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaContent> }) => {
      const { data, error } = await db
        .from('media_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as MediaContent;
    },
    onSuccess: (data: MediaContent) => {
      qc.invalidateQueries({ queryKey: ['org-media', data.organization_id] });
      qc.invalidateQueries({ queryKey: ['media-by-id', data.id] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await db.from('media_content').delete().eq('id', id);
      if (error) throw error;
      return orgId;
    },
    onSuccess: (orgId: string) => {
      qc.invalidateQueries({ queryKey: ['org-media', orgId] });
    },
  });
}

export function useLikeMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mediaId,
      orgId,
      userId,
      liked,
    }: {
      mediaId: string;
      orgId: string;
      userId: string;
      liked: boolean;
    }) => {
      if (liked) {
        await db.from('media_likes').delete().eq('media_id', mediaId).eq('user_id', userId);
        await db.rpc('decrement_like_count', { media_id: mediaId });
      } else {
        await db.from('media_likes').insert({ media_id: mediaId, organization_id: orgId, user_id: userId });
        await db.rpc('increment_like_count', { media_id: mediaId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-media'] });
      qc.invalidateQueries({ queryKey: ['org-media'] });
      qc.invalidateQueries({ queryKey: ['media-by-id'] });
    },
  });
}

export function useTrackView() {
  return useMutation({
    mutationFn: async (mediaId: string) => {
      await db.rpc('increment_view_count', { media_id: mediaId });
    },
  });
}
