import { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckCircle, Loader2, Pencil, Star, ThumbsUp, ImagePlus, X, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useProductReviews, useMyReview, useSubmitReview, useHelpfulReview, useDeleteReview, useSellerReply } from '@/hooks/useProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AnimatedStarRating } from './AnimatedStarRating';
import { useI18n } from '@/i18n/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import { askConfirm } from '@/components/ui/confirm-dialog';

interface Props {
  productId: string;
  organizationId: string;
  isPurchased: boolean;
  isOrgOwner?: boolean;
}

/* ─── Rating Overview Card ─── */
function RatingOverview({ reviews }: { reviews: { rating: number }[] }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
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
        {isFr ? 'Aperçu des notes' : 'Rating overview'}
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
          {reviews.length.toLocaleString()} {isFr ? 'avis' : 'reviews'}
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
                {count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Image Gallery ─── */
function ReviewImageGallery({ images }: { images: string[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 flex-wrap mt-2">
        {images.map((url, i) => (
          <button key={i} onClick={() => setExpanded(url)} className="rounded-lg overflow-hidden border border-border hover:ring-2 ring-primary transition-all">
            <img src={url} alt="" className="h-16 w-16 object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpanded(null)}
          >
            <motion.img
              src={expanded}
              alt=""
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="max-w-full max-h-[80vh] rounded-xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Seller Reply ─── */
function SellerReplySection({ review, productId, isOrgOwner }: { review: any; productId: string; isOrgOwner: boolean }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const sellerReply = useSellerReply();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.seller_reply || '');

  if (review.seller_reply) {
    return (
      <div className="ml-6 mt-2 p-3 rounded-lg bg-muted/50 border-l-2 border-primary/30">
        <p className="text-[11px] font-semibold text-primary mb-1">
          <Reply className="h-3 w-3 inline mr-1" />
          {isFr ? 'Réponse du vendeur' : 'Seller response'}
        </p>
        <p className="text-xs text-muted-foreground">{review.seller_reply}</p>
        {review.seller_reply_at && (
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {format(new Date(review.seller_reply_at), 'dd MMM yyyy', { locale: isFr ? fr : enUS })}
          </p>
        )}
      </div>
    );
  }

  if (!isOrgOwner) return null;

  return (
    <div className="ml-6 mt-2">
      {showReplyForm ? (
        <div className="space-y-2">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={isFr ? 'Répondre à cet avis...' : 'Reply to this review...'}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-hidden focus:ring-2 focus:ring-ring"
            rows={3}
            maxLength={1000}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowReplyForm(false)}>
              {isFr ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={!replyText.trim() || sellerReply.isPending}
              onClick={() => {
                sellerReply.mutate({ reviewId: review.id, productId, reply: replyText }, {
                  onSuccess: () => setShowReplyForm(false),
                });
              }}
            >
              {sellerReply.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {isFr ? 'Répondre' : 'Reply'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowReplyForm(true)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Reply className="h-3 w-3" />
          {isFr ? 'Répondre à cet avis' : 'Reply to this review'}
        </button>
      )}
    </div>
  );
}

/* ─── Single Review Card ─── */
function ReviewCard({ review, productId, isOrgOwner }: { review: any; productId: string; isOrgOwner: boolean }) {
  const helpfulMutation = useHelpfulReview();
  const [hasVoted, setHasVoted] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateFnsLocale = isFr ? fr : enUS;
  const reviewerName = review.profile?.display_name || (isFr ? 'Utilisateur' : 'User');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl border border-border bg-card space-y-3"
    >
      <div className="flex items-start gap-3">
        {review.profile?.avatar_url ? (
          <img
            src={review.profile.avatar_url}
            loading="lazy"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
            alt={reviewerName}
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-border">
            {reviewerName[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {review.profile?.display_name || (isFr ? 'Utilisateur' : 'User')}
            </span>
            {review.is_verified_purchase && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                <CheckCircle className="h-2.5 w-2.5" /> {isFr ? 'Achat vérifié' : 'Verified purchase'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <AnimatedStarRating rating={review.rating} size="sm" />
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(review.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
            </span>
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="text-sm font-bold text-foreground leading-snug">{review.title}</h4>
      )}

      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      )}

      <ReviewImageGallery images={review.image_urls || []} />

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
          {isFr ? 'Utile' : 'Helpful'}
          {(review.helpful_count > 0 || hasVoted) && (
            <span className="font-medium">({(review.helpful_count || 0) + (hasVoted ? 1 : 0)})</span>
          )}
        </button>
      </div>

      <SellerReplySection review={review} productId={productId} isOrgOwner={isOrgOwner} />
    </motion.div>
  );
}

/* ─── Image Upload Helper ─── */
function ReviewImageUpload({ images, setImages, maxImages = 3 }: { images: string[]; setImages: (imgs: string[]) => void; maxImages?: number }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < Math.min(files.length, maxImages - images.length); i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) continue; // 5MB max
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from('review-images').upload(path, file);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(path);
          newUrls.push(publicUrl);
        }
      }
      setImages([...images, ...newUrls]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <button
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < maxImages && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/50"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
            {isFr ? `Ajouter des photos (${images.length}/${maxImages})` : `Add photos (${images.length}/${maxImages})`}
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export function ProductReviews({ productId, organizationId, isPurchased, isOrgOwner = false }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateFnsLocale = isFr ? fr : enUS;
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: myReview } = useMyReview(productId);
  const submitReview = useSubmitReview();
  const deleteReview = useDeleteReview();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (myReview && showForm) {
      setRating(myReview.rating);
      setTitle(myReview.title || '');
      setComment(myReview.comment || '');
      setImageUrls(myReview.image_urls || []);
    }
  }, [myReview, showForm]);

  const canWriteReview = !!user && !myReview;
  const hasReviews = reviews.length > 0;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: isFr ? 'Sélectionnez une note' : 'Select a rating', variant: 'destructive' });
      return;
    }
    if (!title.trim()) {
      toast({ title: isFr ? 'Ajoutez un titre à votre avis' : 'Add a title to your review', variant: 'destructive' });
      return;
    }
    if (!comment.trim()) {
      toast({ title: isFr ? 'Ajoutez une description à votre avis' : 'Add a description to your review', variant: 'destructive' });
      return;
    }
    try {
      await submitReview.mutateAsync({
        productId, organizationId, rating, title: title.trim(), comment: comment.trim(),
        isVerifiedPurchase: isPurchased, imageUrls,
      });
      toast({ title: isFr ? '✅ Avis publié !' : '✅ Review published!' });
      setShowForm(false);
      setRating(0);
      setTitle('');
      setComment('');
      setImageUrls([]);
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    const confirmed =(await askConfirm(isFr ? 'Supprimer définitivement votre avis ? Cette action est irréversible.' : 'Permanently delete your review? This action is irreversible.'));
    if (!confirmed) return;
    try {
      await deleteReview.mutateAsync({ reviewId: myReview.id, productId });
      toast({ title: isFr ? 'Avis supprimé' : 'Review deleted' });
      setShowForm(false);
      setRating(0);
      setTitle('');
      setComment('');
      setImageUrls([]);
    } catch (e: any) {
      toast({ title: isFr ? 'Erreur' : 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const otherReviews = reviews.filter(r => r.user_id !== user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">{isFr ? 'Avis & Notes' : 'Reviews & Ratings'}</h2>
        {hasReviews && (
          <span className="text-sm text-muted-foreground">({reviews.length})</span>
        )}
      </div>

      {reviews.length >= 1 && <RatingOverview reviews={reviews} />}

      {canWriteReview && !showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            variant="outline"
            className="w-full gap-2 py-5 rounded-xl border-dashed border-2 text-sm font-medium hover:bg-accent/5"
            onClick={() => setShowForm(true)}
          >
            <Pencil className="h-4 w-4" />
            {isFr ? 'Écrire un avis' : 'Write a review'}
          </Button>
        </motion.div>
      )}

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
              <p className="text-sm font-semibold text-foreground">{isFr ? 'Votre avis compte !' : 'Your review matters!'}</p>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{isFr ? 'Note :' : 'Rating:'}</span>
                <AnimatedStarRating rating={rating} onRate={setRating} interactive size="lg" />
                {rating > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-lg font-bold text-foreground">
                    {rating}.0
                  </motion.span>
                )}
              </div>

              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isFr ? 'Titre de votre avis (ex: Excellent produit !)' : 'Review title (e.g. Excellent product!)'}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                maxLength={120}
                required
              />

              <textarea
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={isFr ? "Décrivez votre expérience en détail… Qu'avez-vous aimé ? Qu'est-ce qui pourrait être amélioré ?" : 'Describe your experience in detail… What did you like? What could be improved?'}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-hidden focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                maxLength={2000}
                required
              />

              <ReviewImageUpload images={imageUrls} setImages={setImageUrls} />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {comment.length}/2000 {isFr ? 'caractères' : 'characters'}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                    {isFr ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button size="sm" onClick={handleSubmit} disabled={submitReview.isPending} className="gap-1.5">
                    {submitReview.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isFr ? 'Publier mon avis' : 'Publish review'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {myReview && !showForm && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {myReview.profile?.avatar_url ? (
                <img src={myReview.profile.avatar_url} loading="lazy" className="h-9 w-9 rounded-full object-cover ring-2 ring-border" alt={myReview.profile?.display_name || ''} />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-border">
                  {(myReview.profile?.display_name || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {myReview.profile?.display_name || user?.email?.split('@')[0] || (isFr ? 'Utilisateur' : 'User')}
                  </span>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {isFr ? 'Votre avis' : 'Your review'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <AnimatedStarRating rating={myReview.rating} size="sm" />
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(myReview.created_at), 'dd MMM yyyy', { locale: dateFnsLocale })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => setShowForm(true)}>
                <Pencil className="h-3 w-3" /> {isFr ? 'Modifier' : 'Edit'}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDeleteReview} disabled={deleteReview.isPending}>
                {deleteReview.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (isFr ? 'Supprimer' : 'Delete')}
              </Button>
            </div>
          </div>
          {myReview.title && <h4 className="text-sm font-bold text-foreground">{myReview.title}</h4>}
          {myReview.comment && <p className="text-sm text-foreground leading-relaxed">{myReview.comment}</p>}
          <ReviewImageGallery images={myReview.image_urls || []} />
        </motion.div>
      )}

      {isLoading ? (
        <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : !hasReviews && !myReview ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-card via-background to-primary/5 p-8 text-center space-y-3"
        >
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {isFr ? 'Aucun avis pour le moment' : 'No reviews yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isPurchased
              ? (isFr ? 'Vous avez acheté ce produit — soyez le premier à partager votre expérience !' : 'You purchased this product — be the first to share your experience!')
              : !user
                ? (isFr ? 'Connectez-vous et achetez ce produit pour laisser le premier avis.' : 'Sign in and purchase this product to leave the first review.')
                : (isFr ? 'Soyez le premier à laisser un avis dès votre achat.' : 'Be the first to leave a review after your purchase.')}
          </p>
          {isPurchased && !showForm && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {isFr ? 'Écrire le premier avis' : 'Write the first review'}
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {otherReviews.map((review, i) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ReviewCard review={review} productId={productId} isOrgOwner={isOrgOwner} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
