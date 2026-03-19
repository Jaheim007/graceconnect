
-- 1. Add image_urls and seller_reply columns to product_reviews
ALTER TABLE public.product_reviews 
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seller_reply text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_reply_at timestamptz DEFAULT NULL;

-- 2. Create review-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for review-images bucket
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images');

CREATE POLICY "Users can delete own review images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Add review_reminder_count to product_purchases for J+7 follow-up
ALTER TABLE public.product_purchases
  ADD COLUMN IF NOT EXISTS review_reminder_count integer DEFAULT 0;

-- 5. Update featured_score formula to weight reviews more heavily
CREATE OR REPLACE FUNCTION public.recalculate_featured_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer := 0;
BEGIN
  -- Score formula: sales + reviews + rating bonus + recency
  -- Reviews and ratings now have higher weight for social proof
  UPDATE public.digital_products
  SET featured_score = (
    COALESCE(sales_count, 0) * 3 +
    COALESCE(review_count, 0) * 5 +
    CASE 
      WHEN COALESCE(average_rating, 0) >= 4.5 AND COALESCE(review_count, 0) >= 3 THEN 50
      WHEN COALESCE(average_rating, 0) >= 4.0 AND COALESCE(review_count, 0) >= 2 THEN 30
      WHEN COALESCE(average_rating, 0) >= 3.5 THEN 15
      ELSE COALESCE(average_rating, 0) * 5
    END +
    GREATEST(0, 30 - EXTRACT(DAY FROM now() - COALESCE(updated_at, created_at)))
  )
  WHERE is_published = true;
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;
