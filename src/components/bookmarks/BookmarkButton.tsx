import { Bookmark } from 'lucide-react';
import { useIsBookmarked, useToggleBookmark, type BookmarkContentType } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  contentType: BookmarkContentType;
  contentId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function BookmarkButton({ contentType, contentId, className, size = 'sm' }: BookmarkButtonProps) {
  const { user } = useAuth();
  const { data: isBookmarked } = useIsBookmarked(contentType, contentId);
  const toggle = useToggleBookmark();

  if (!user) return null;

  const s = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const iconS = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle.mutate({ contentType, contentId }); }}
      className={cn(
        s, 'rounded-full flex items-center justify-center transition-all',
        isBookmarked ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground hover:text-foreground',
        className
      )}
      aria-label={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={isBookmarked}
    >
      <Bookmark className={cn(iconS, isBookmarked && 'fill-current')} />
    </button>
  );
}
