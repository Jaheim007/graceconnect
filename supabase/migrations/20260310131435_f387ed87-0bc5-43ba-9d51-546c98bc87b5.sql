-- Add missing AI analysis columns referenced by submit_org_kyc RPC
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS ai_confidence_score numeric,
  ADD COLUMN IF NOT EXISTS ai_ocr_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_quality_assessment jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_face_match jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_fraud_detection jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_recommendations text,
  ADD COLUMN IF NOT EXISTS ai_analyzed_at timestamptz;