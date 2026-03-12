import { useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useComments, useAddComment, useDeleteComment, type CommentContentType } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface CommentSectionProps {
  contentType: CommentContentType;
  contentId: string;
  className?: string;
}

export function CommentSection({ contentType, contentId, className }: CommentSectionProps) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(contentType, contentId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addComment.mutate({ contentType, contentId, body: body.trim() }, {
      onSuccess: () => setBody(''),
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4" />
        Commentaires ({comments.length})
      </h4>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 h-9 text-sm"
            maxLength={500}
            aria-label="Écrire un commentaire"
          />
          <Button type="submit" size="sm" disabled={!body.trim() || addComment.isPending} className="h-9 px-3">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="py-4 text-center text-xs text-muted-foreground">Chargement...</div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">Aucun commentaire</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="flex gap-2 group">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {c.profiles?.avatar_url ? (
                  <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-[10px] font-bold">{(c.profiles?.display_name || '?')[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className="font-semibold">{c.profiles?.display_name || 'Utilisateur'}</span>
                  <span className="text-muted-foreground ml-1.5 text-[10px]">
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.body}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => deleteComment.mutate({ id: c.id, contentType, contentId })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  aria-label="Supprimer le commentaire"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
