import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Loader2, Pencil, Star, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useProductReviews, useMyReview, useSubmitReview, useHelpfulReview, useDeleteReview } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AnimatedStarRating } from './AnimatedStarRating';

interface Props {
  productId: string;
  organizationId: string;
  isPurchased: boolean;
}

/* ─── Rating Overview Card ─── */
function RatingOverview({ reviews }: { reviews: { rating: number }[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-5"
    >
      <h3 className="text-sm font-semibold text-center text-muted-foreground tracking-wide uppercase">
        Aperçu des notes
      </h3>

      <div className="text-center space-y-1.5">
        <p className="text-5xl font-extrabold text-foreground tracking-tight">
          {avg.toFixed(1)}
          <span className="text-lg font-normal text-muted-foreground">/5</span>
        </p>
        <div className="flex justify-center">
          <AnimatedStarRating rating={Math.round(avg)} size="md" />
        </div>
        <p className="text-xs text-muted-foreground">
          {reviews.length.toLocaleString('fr-FR')} avis
        </p>
      </div>

      <div className="space-y-2">
        {counts.map(({ star, count }) => {
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5 text-sm">
              <span className="w-4 text-right font-medium text-foreground">{star}</span>
              <Star className="h-3.5 w-3.5 fill-[hsl(var(--accent))] text-[hsl(var(--accent))]" />
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[hsl(var(--accent))]"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: (5 - star) * 0.08, ease: 'easeOut' }}
                />
              </div>
              <span className="w-10 text-right text-muted-foreground font-medium tabular-nums">
                {count.toLocaleString('fr-FR')}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Single Review Card ─── */
function ReviewCard({ review, productId }: { review: any; productId: string }) {
  const helpfulMutation = useHelpfulReview();
  const [hasVoted, setHasVoted] = useState(false);
  const reviewerName = review.profile?.display_name || 'Utilisateur';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl border border-border bg-card space-y-3"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {review.profile?.avatar_url ? (
          <img
            src={review.profile.avatar_url}
            loading="lazy"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
            alt={`Avatar de ${reviewerName}`}
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-border">
            {reviewerName[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {review.profile?.display_name || 'Utilisateur'}
            </span>
            {review.is_verified_purchase && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                <CheckCircle className="h-2.5 w-2.5" /> Achat vérifié
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <AnimatedStarRating rating={review.rating} size="sm" />
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(review.created_at), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="text-sm font-bold text-foreground leading-snug">{review.title}</h4>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      )}

      {/* Helpful button */}
      <div className="flex items-center pt-1">
        <button
          disabled={hasVoted || helpfulMutation.isPending}
          onClick={() => {
            helpfulMutation.mutate({ reviewId: review.id, productId });
            setHasVoted(true);
          }}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 transition-colors',
            hasVoted
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <ThumbsUp className="h-3 w-3" />
          Utile
          {(review.helpful_count > 0 || hasVoted) && (
            <span className="font-medium">({(review.helpful_count || 0) + (hasVoted ? 1 : 0)})</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function ProductReviews({ productId, organizationId, isPurchased }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: myReview } = useMyReview(productId);
  const submitReview = useSubmitReview();
  const deleteReview = useDeleteReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // Sync form when editing existing review
  useEffect(() => {
    if (myReview && showForm) {
      setRating(myReview.rating);
      setTitle(myReview.title || '');
      setComment(myReview.comment || '');
    }
  }, [myReview, showForm]);

  const canWriteReview = !!user && isPurchased && !myReview;
  const hasReviews = reviews.length > 0;

  if (!hasReviews && !canWriteReview && !myReview && !showForm) {
    return null;
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Sélectionnez une note', variant: 'destructive' });
      return;
    }
    if (!title.trim()) {
      toast({ title: 'Ajoutez un titre à votre avis', variant: 'destructive' });
      return;
    }
    if (!comment.trim()) {
      toast({ title: 'Ajoutez une description à votre avis', variant: 'destructive' });
      return;
    }
    try {
      await submitReview.mutateAsync({
        productId, organizationId, rating, title: title.trim(), comment: comment.trim(),
        isVerifiedPurchase: isPurchased,
      });
      toast({ title: '✅ Avis publié !' });
      setShowForm(false);
      setRating(0);
      setTitle('');
      setComment('');
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;

    const confirmed = window.confirm('Supprimer définitivement votre avis ? Cette action est irréversible.');
    if (!confirmed) return;

    try {
      await deleteReview.mutateAsync({ reviewId: myReview.id, productId });
      toast({ title: 'Avis supprimé' });
      setShowForm(false);
      setRating(0);
      setTitle('');
      setComment('');
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const otherReviews = reviews.filter(r => r.user_id !== user?.id);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Avis & Notes</h2>
        {hasReviews && (
          <span className="text-sm text-muted-foreground">({reviews.length})</span>
        )}
      </div>

      {/* Rating overview card */}
      {reviews.length >= 1 && <RatingOverview reviews={reviews} />}

      {/* Write review CTA */}
      {canWriteReview && !showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="outline"
            className="w-full gap-2 py-5 rounded-xl border-dashed border-2 text-sm font-medium hover:bg-accent/5"
            onClick={() => setShowForm(true)}
          >
            <Pencil className="h-4 w-4" />
            Écrire un avis
          </Button>
        </motion.div>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
              <p className="text-sm font-semibold text-foreground">Votre avis compte !</p>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Note :</span>
                <AnimatedStarRating rating={rating} onRate={setRating} interactive size="lg" />
                {rating > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold text-foreground"
                  >
                    {rating}.0
                  </motion.span>
                )}
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre de votre avis (ex: Excellent produit !)"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                maxLength={120}
                required
              />

              {/* Comment */}
              <textarea
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Décrivez votre expérience en détail… Qu'avez-vous aimé ? Qu'est-ce qui pourrait être amélioré ?"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                maxLength={2000}
                required
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {comment.length}/2000 caractères
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitReview.isPending}
                    className="gap-1.5"
                  >
                    {submitReview.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Publier mon avis
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current user's review */}
      {myReview && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AnimatedStarRating rating={myReview.rating} size="sm" />
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Votre avis
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={() => setShowForm(true)}
            >
              <Pencil className="h-3 w-3" /> Modifier
            </Button>
          </div>
          {myReview.title && (
            <h4 className="text-sm font-bold text-foreground">{myReview.title}</h4>
          )}
          {myReview.comment && (
            <p className="text-sm text-foreground leading-relaxed">{myReview.comment}</p>
          )}
        </motion.div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : !hasReviews ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Aucun avis pour le moment.{isPurchased ? ' Soyez le premier !' : ''}
        </p>
      ) : (
        <div className="space-y-3">
          {otherReviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ReviewCard review={review} productId={productId} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
