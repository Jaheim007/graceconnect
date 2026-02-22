
CREATE OR REPLACE FUNCTION public.delete_user_account(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete referrals (as referrer or referred)
  DELETE FROM public.user_referrals WHERE referrer_id = _user_id OR referred_id = _user_id;

  -- Delete lesson progress
  DELETE FROM public.lesson_progress WHERE user_id = _user_id;

  -- Delete program enrollments
  DELETE FROM public.program_enrollments WHERE user_id = _user_id;

  -- Delete affiliate sales referencing user's affiliate links
  DELETE FROM public.affiliate_sales WHERE affiliate_link_id IN (
    SELECT id FROM public.affiliate_links WHERE user_id = _user_id
  );
  DELETE FROM public.affiliate_sales WHERE affiliate_user_id = _user_id;

  -- Delete purchases and donations
  DELETE FROM public.product_purchases WHERE user_id = _user_id;
  DELETE FROM public.donations WHERE user_id = _user_id;

  -- Delete fraud flags
  DELETE FROM public.fraud_flags WHERE user_id = _user_id;

  -- Delete all organizations owned by this user
  DELETE FROM public.organizations WHERE owner_id = _user_id;

  -- Delete memberships
  DELETE FROM public.organization_members WHERE user_id = _user_id;

  -- Delete affiliate links
  DELETE FROM public.affiliate_links WHERE user_id = _user_id;

  -- Delete notifications, push subs, watch history, likes, saves
  DELETE FROM public.user_notifications WHERE user_id = _user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = _user_id;
  DELETE FROM public.watch_history WHERE user_id = _user_id;
  DELETE FROM public.media_likes WHERE user_id = _user_id;
  DELETE FROM public.media_saves WHERE user_id = _user_id;

  -- Delete payout requests and content reports
  DELETE FROM public.payout_requests WHERE user_id = _user_id;
  DELETE FROM public.content_reports WHERE reporter_user_id = _user_id;

  -- Delete profile and platform roles
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM public.user_platform_roles WHERE user_id = _user_id;

  -- Delete auth user
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
