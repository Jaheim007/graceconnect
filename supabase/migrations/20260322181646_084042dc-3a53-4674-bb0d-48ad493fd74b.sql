-- Add missing columns to webhook_deliveries for retry support
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'webhook_deliveries' AND column_name = 'next_retry_at'
  ) THEN
    ALTER TABLE public.webhook_deliveries ADD COLUMN next_retry_at timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'webhook_deliveries' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.webhook_deliveries ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Index for retry worker performance
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retrying 
  ON public.webhook_deliveries(next_retry_at) 
  WHERE status = 'retrying';