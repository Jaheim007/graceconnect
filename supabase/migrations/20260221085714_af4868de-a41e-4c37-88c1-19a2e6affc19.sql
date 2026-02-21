CREATE OR REPLACE FUNCTION public.delete_user_account(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the caller is the user themselves
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete affiliate sales referencing user's affiliate links (FK dependency)
  DELETE FROM public.affiliate_sales WHERE affiliate_link_id IN (
    SELECT id FROM public.affiliate_links WHERE user_id = _user_id
  );

  -- Delete affiliate sales where user is the affiliate
  DELETE FROM public.affiliate_sales WHERE affiliate_user_id = _user_id;

  -- Delete product purchases by this user
  DELETE FROM public.product_purchases WHERE user_id = _user_id;

  -- Delete donations by this user
  DELETE FROM public.donations WHERE user_id = _user_id;

  -- Delete all organizations owned by this user (cascades to members, content, etc.)
  DELETE FROM public.organizations WHERE owner_id = _user_id;

  -- Delete the user's memberships in other orgs
  DELETE FROM public.organization_members WHERE user_id = _user_id;

  -- Delete user's affiliate links and related data
  DELETE FROM public.affiliate_links WHERE user_id = _user_id;

  -- Delete user's notifications
  DELETE FROM public.user_notifications WHERE user_id = _user_id;

  -- Delete user's push subscriptions
  DELETE FROM public.push_subscriptions WHERE user_id = _user_id;

  -- Delete user's watch history
  DELETE FROM public.watch_history WHERE user_id = _user_id;

  -- Delete user's media likes and saves
  DELETE FROM public.media_likes WHERE user_id = _user_id;
  DELETE FROM public.media_saves WHERE user_id = _user_id;

  -- Delete payout requests
  DELETE FROM public.payout_requests WHERE user_id = _user_id;

  -- Delete content reports by this user
  DELETE FROM public.content_reports WHERE reporter_user_id = _user_id;

  -- Delete user's profile
  DELETE FROM public.profiles WHERE id = _user_id;

  -- Delete user's platform roles
  DELETE FROM public.user_platform_roles WHERE user_id = _user_id;

  -- Finally delete the auth user
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;