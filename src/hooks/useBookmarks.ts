import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export type BookmarkContentType = 'product' | 'media' | 'event' | 'campaign' | 'announcement';

export function useBookmarks(contentType?: BookmarkContentType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bookmarks', user?.id, contentType],
    queryFn: async () => {
      if (!user) return [];
      let q = db.from('user_bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (contentType) q = q.eq('content_type', contentType);
      const { data } = await q;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useIsBookmarked(contentType: BookmarkContentType, contentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bookmark', user?.id, contentType, contentId],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await db.from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!contentId,
  });
}

export function useToggleBookmark() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId }: { contentType: BookmarkContentType; contentId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await db.from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle();
      if (existing) {
        await db.from('user_bookmarks').delete().eq('id', existing.id);
        return false;
      } else {
        await db.from('user_bookmarks').insert({ user_id: user.id, content_type: contentType, content_id: contentId });
        return true;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      qc.invalidateQueries({ queryKey: ['bookmark', user?.id, vars.contentType, vars.contentId] });
    },
  });
}
