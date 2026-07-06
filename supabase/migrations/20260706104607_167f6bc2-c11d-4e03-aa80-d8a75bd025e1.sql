
-- 1) Extend kyc_submissions to also cover beauty providers
ALTER TABLE public.kyc_submissions
  ALTER COLUMN organization_id DROP NOT NULL;

ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS beauty_provider_id uuid
    REFERENCES public.beauty_providers(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS kyc_submissions_beauty_provider_id_key
  ON public.kyc_submissions(beauty_provider_id)
  WHERE beauty_provider_id IS NOT NULL;

ALTER TABLE public.kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_owner_check;
ALTER TABLE public.kyc_submissions
  ADD CONSTRAINT kyc_submissions_owner_check
  CHECK (
    (organization_id IS NOT NULL AND beauty_provider_id IS NULL)
    OR (organization_id IS NULL AND beauty_provider_id IS NOT NULL)
  );

-- 2) RLS: let the beauty provider owner see their own submission
DROP POLICY IF EXISTS "Beauty provider owner can view own kyc submission" ON public.kyc_submissions;
CREATE POLICY "Beauty provider owner can view own kyc submission"
  ON public.kyc_submissions
  FOR SELECT
  TO authenticated
  USING (
    beauty_provider_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.beauty_providers bp
      WHERE bp.id = kyc_submissions.beauty_provider_id
        AND bp.user_id = auth.uid()
    )
  );

-- 3) RPC used by the wizard's beauty mode
CREATE OR REPLACE FUNCTION public.submit_beauty_kyc(
  _provider_id uuid,
  _id_document_url text,
  _id_document_type text,
  _id_document_back_url text,
  _selfie_url text,
  _selfie_with_doc_url text,
  _bank_account_name text,
  _bank_account_number text,
  _bank_name text,
  _payout_method text,
  _payout_phone text,
  _payout_provider text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing uuid;
  v_submission_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ownership check
  IF NOT EXISTS (
    SELECT 1 FROM public.beauty_providers
    WHERE id = _provider_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'Not authorized for this provider';
  END IF;

  SELECT id INTO v_existing
  FROM public.kyc_submissions
  WHERE beauty_provider_id = _provider_id;

  IF v_existing IS NOT NULL THEN
    UPDATE public.kyc_submissions SET
      id_document_url = _id_document_url,
      id_document_type = _id_document_type,
      id_document_back_url = _id_document_back_url,
      selfie_url = _selfie_url,
      selfie_with_doc_url = _selfie_with_doc_url,
      bank_account_name = _bank_account_name,
      bank_account_number = _bank_account_number,
      bank_name = _bank_name,
      payout_method = _payout_method,
      payout_phone = _payout_phone,
      payout_provider = _payout_provider,
      verification_type = 'individual',
      kyc_level = 1,
      status = 'pending',
      rejection_reason = NULL,
      submitted_by = v_user,
      submitted_at = now()
    WHERE id = v_existing
    RETURNING id INTO v_submission_id;
  ELSE
    INSERT INTO public.kyc_submissions (
      beauty_provider_id, submitted_by, status, verification_type, kyc_level,
      id_document_url, id_document_type, id_document_back_url,
      selfie_url, selfie_with_doc_url,
      bank_account_name, bank_account_number, bank_name,
      payout_method, payout_phone, payout_provider,
      submitted_at
    ) VALUES (
      _provider_id, v_user, 'pending', 'individual', 1,
      _id_document_url, _id_document_type, _id_document_back_url,
      _selfie_url, _selfie_with_doc_url,
      _bank_account_name, _bank_account_number, _bank_name,
      _payout_method, _payout_phone, _payout_provider,
      now()
    )
    RETURNING id INTO v_submission_id;
  END IF;

  UPDATE public.beauty_providers
     SET kyc_submission_id = v_submission_id,
         updated_at = now()
   WHERE id = _provider_id;

  RETURN jsonb_build_object('submission_id', v_submission_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_beauty_kyc(
  uuid, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- 4) Propagate approval/rejection back to beauty_providers.status
CREATE OR REPLACE FUNCTION public.beauty_kyc_status_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.beauty_provider_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.beauty_providers
         SET status = 'active', updated_at = now()
       WHERE id = NEW.beauty_provider_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beauty_kyc_status_sync ON public.kyc_submissions;
CREATE TRIGGER trg_beauty_kyc_status_sync
  AFTER UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.beauty_kyc_status_sync();
