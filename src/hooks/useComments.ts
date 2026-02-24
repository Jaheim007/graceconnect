import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export type CommentContentType = 'announcement' | 'event' | 'media';

export function useComments(contentType: CommentContentType, contentId: string | undefined) {
  return useQuery({
    queryKey: ['comments', contentType, contentId],
    queryFn: async () => {
      if (!contentId) return [];
      const { data } = await db.from('content_comments')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!contentId,
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contentType, contentId, body, parentId }: {
      contentType: CommentContentType; contentId: string; body: string; parentId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db.from('content_comments').insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        body,
        parent_id: parentId || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.contentType, vars.contentId] });
    },
  });
}

export function useDeleteComment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentType, contentId }: { id: string; contentType: string; contentId: string }) => {
      if (!user) throw new Error('Not authenticated');
      await db.from('content_comments').delete().eq('id', id).eq('user_id', user.id);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.contentType, vars.contentId] });
    },
  });
}
