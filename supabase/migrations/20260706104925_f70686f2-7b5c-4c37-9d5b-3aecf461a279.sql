
CREATE OR REPLACE FUNCTION public.review_beauty_kyc(
  _submission_id uuid,
  _action text,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_superadmin(v_user) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  IF _action = 'approve' THEN
    UPDATE public.kyc_submissions
       SET status = 'approved',
           rejection_reason = NULL,
           reviewed_at = now(),
           reviewed_by = v_user
     WHERE id = _submission_id AND beauty_provider_id IS NOT NULL;
  ELSIF _action = 'reject' THEN
    UPDATE public.kyc_submissions
       SET status = 'rejected',
           rejection_reason = _reason,
           reviewed_at = now(),
           reviewed_by = v_user
     WHERE id = _submission_id AND beauty_provider_id IS NOT NULL;
  ELSE
    RAISE EXCEPTION 'Invalid action';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_beauty_kyc(uuid, text, text) TO authenticated;
