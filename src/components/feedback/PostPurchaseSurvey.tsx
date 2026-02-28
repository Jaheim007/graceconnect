import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';

interface PostPurchaseSurveyProps {
  productId: string;
  productTitle: string;
  organizationId: string;
  onDone?: () => void;
}

/**
 * Post-purchase satisfaction survey shown after downloading a product.
 * Collects a 1-5 star rating + optional comment, stored in product_reviews.
 */
export function PostPurchaseSurvey({ productId, productTitle, organizationId, onDone }: PostPurchaseSurveyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const storageKey = `survey_${productId}_${user?.id}`;

  useEffect(() => {
    if (!user) return;
    // Don't show if already reviewed
    if (localStorage.getItem(storageKey)) return;

    // Check if already reviewed in DB
    db.from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .then(({ count }) => {
        if ((count || 0) === 0) {
          // Show after a slight delay
          setTimeout(() => setVisible(true), 2000);
        } else {
          localStorage.setItem(storageKey, '1');
        }
      });
  }, [user, productId, storageKey]);

  const handleSubmit = async () => {
    if (rating === 0 || !user) return;
    setSubmitting(true);
    try {
      await db.from('product_reviews').upsert({
        product_id: productId,
        user_id: user.id,
        organization_id: organizationId,
        rating,
        comment: comment.trim() || null,
      }, { onConflict: 'product_id,user_id' });

      // Update product average rating
      const { data: reviews } = await db.from('product_reviews')
        .select('rating')
        .eq('product_id', productId);

      if (reviews?.length) {
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        await db.from('digital_products').update({
          average_rating: Math.round(avg * 10) / 10,
          review_count: reviews.length,
        }).eq('id', productId);
      }

      localStorage.setItem(storageKey, '1');
      setSubmitted(true);
      toast({ title: isFr ? '🙏 Merci pour votre avis !' : '🙏 Thanks for your feedback!' });

      setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 2000);
    } catch (e) {
      console.warn('[PostPurchaseSurvey] Error:', e);
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, '1');
    onDone?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-20 left-4 z-50 max-w-sm"
        >
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xl space-y-3">
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center py-4 space-y-2"
              >
                <ThumbsUp className="h-10 w-10 text-primary mx-auto" />
                <p className="font-bold">{isFr ? 'Merci !' : 'Thank you!'}</p>
                <p className="text-xs text-muted-foreground">
                  {isFr ? 'Votre avis aide la communauté.' : 'Your feedback helps the community.'}
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {isFr ? 'Qu\'en pensez-vous ?' : 'What do you think?'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {productTitle}
                    </p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex justify-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                  >
                    <Textarea
                      placeholder={isFr ? 'Un commentaire ? (optionnel)' : 'Any comments? (optional)'}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="h-16 text-sm resize-none"
                    />
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-1 text-xs">
                    {isFr ? 'Plus tard' : 'Later'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="flex-1 gap-1.5 text-xs"
                  >
                    <Send className="h-3 w-3" />
                    {isFr ? 'Envoyer' : 'Submit'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
