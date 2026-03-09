import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsWishlisted, useToggleWishlist } from '@/hooks/useWishlist';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function WishlistButton({ productId, variant = 'icon', className }: WishlistButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isWishlisted = false } = useIsWishlisted(productId);
  const toggle = useToggleWishlist();
  const { t } = useI18n();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      navigate('/auth?returnTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    toggle.mutate({ productId, isCurrentlyWishlisted: isWishlisted });
  };

  if (variant === 'full') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-1.5', className)}
        onClick={handleClick}
        disabled={toggle.isPending}
      >
        {toggle.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Heart className={cn('h-3.5 w-3.5 transition-all', isWishlisted && 'fill-red-500 text-red-500')} />
        )}
        {isWishlisted ? t('wishlist.saved') : t('wishlist.save')}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggle.isPending}
      className={cn(
        'absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 shadow-sm transition-all hover:scale-110',
        isWishlisted && 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
        className,
      )}
      aria-label={isWishlisted ? t('wishlist.remove') : t('wishlist.add')}
    >
      {toggle.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground hover:text-red-400',
          )}
        />
      )}
    </button>
  );
}
