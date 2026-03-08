import { useState } from 'react';
import { Star, MessageSquare, CheckCircle, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductReviews, useMyReview, useSubmitReview } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  organizationId: string;
  isPurchased: boolean;
}

function StarRating({ rating, onRate, interactive = false, size = 'md' }: {
  rating: number; onRate?: (r: number) => void; interactive?: boolean; size?: 'sm' | 'md';
}) {
  const [hover, setHover] = useState(0);
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          className={cn('transition-colors', interactive && 'cursor-pointer hover:scale-110')}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => onRate?.(i)}
        >
          <Star
            className={cn(
              px,
              (hover || rating) >= i
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function RatingDistribution({ reviews }: { reviews: { rating: number }[] }) {
  if (reviews.length === 0) return null;
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  const max = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="space-y-1.5 py-2">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-3 text-right font-medium text-muted-foreground">{star}</span>
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, organizationId, isPurchased }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: myReview } = useMyReview(productId);
  const submitReview = useSubmitReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(myReview?.rating || 0);
  const [comment, setComment] = useState(myReview?.comment || '');

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Sélectionnez une note', variant: 'destructive' });
      return;
    }
    try {
      await submitReview.mutateAsync({
        productId, organizationId, rating, comment,
        isVerifiedPurchase: isPurchased,
      });
      toast({ title: '✅ Avis publié !' });
      setShowForm(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  // Only show reviews section if there are at least 3 published reviews OR user can write one
  const canWriteReview = !!user && isPurchased && !myReview;
  const hasEnoughReviews = reviews.length >= 3;
  
  if (!hasEnoughReviews && !canWriteReview && !myReview && !showForm) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Avis ({reviews.length})
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={Math.round(avgRating)} size="sm" />
            <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      {reviews.length >= 3 && (
        <div className="p-4 rounded-xl border border-border bg-card/50">
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className="text-3xl font-bold text-primary">{avgRating.toFixed(1)}</p>
              <StarRating rating={Math.round(avgRating)} size="sm" />
              <p className="text-[10px] text-muted-foreground mt-1">{reviews.length} avis</p>
            </div>
            <div className="flex-1">
              <RatingDistribution reviews={reviews} />
            </div>
          </div>
        </div>
      )}

      {/* Write review CTA */}
      {user && isPurchased && !myReview && !showForm && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <Star className="h-3.5 w-3.5" /> Donner mon avis
        </Button>
      )}

      {/* Review form */}
      {showForm && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <p className="text-sm font-medium">Votre avis</p>
          <StarRating rating={rating} onRate={setRating} interactive />
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Partagez votre expérience avec ce produit… (optionnel)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={1000}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground gap-1.5"
              onClick={handleSubmit}
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Publier
            </Button>
          </div>
        </div>
      )}

      {/* Existing review by current user */}
      {myReview && !showForm && (
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
          <div className="flex items-center gap-2">
            <StarRating rating={myReview.rating} size="sm" />
            <span className="text-xs text-muted-foreground">Votre avis</span>
          </div>
          {myReview.comment && <p className="text-sm">{myReview.comment}</p>}
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => {
            setRating(myReview.rating);
            setComment(myReview.comment || '');
            setShowForm(true);
          }}>
            Modifier
          </Button>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Aucun avis pour le moment. {isPurchased ? 'Soyez le premier !' : ''}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.filter(r => r.user_id !== user?.id).map(review => (
            <div key={review.id} className="p-3 rounded-xl border border-border bg-card/50 space-y-1.5">
              <div className="flex items-center gap-2">
                {review.profile?.avatar_url ? (
                  <img src={review.profile.avatar_url} loading="lazy" className="h-6 w-6 rounded-full object-cover" alt="" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {(review.profile?.display_name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium">{review.profile?.display_name || 'Utilisateur'}</span>
                {review.is_verified_purchase && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                    <CheckCircle className="h-3 w-3" /> Achat vérifié
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {format(new Date(review.created_at), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
              <StarRating rating={review.rating} size="sm" />
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
