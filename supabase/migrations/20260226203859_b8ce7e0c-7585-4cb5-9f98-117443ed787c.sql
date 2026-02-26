
ALTER TABLE public.download_logs
  DROP CONSTRAINT IF EXISTS download_logs_purchase_id_fkey,
  ADD CONSTRAINT download_logs_purchase_id_fkey
    FOREIGN KEY (purchase_id) REFERENCES public.product_purchases(id)
    ON DELETE CASCADE;
