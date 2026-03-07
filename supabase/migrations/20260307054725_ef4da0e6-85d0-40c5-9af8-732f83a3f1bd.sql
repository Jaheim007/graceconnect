
-- Function to track affiliate clicks and notify ambassador
CREATE OR REPLACE FUNCTION public.track_affiliate_click(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _link record;
  _prev_clicks integer;
BEGIN
  -- Find the affiliate link
  SELECT id, user_id, clicks, organization_id INTO _link
  FROM public.affiliate_links
  WHERE code = _code AND is_active = true;

  IF _link IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  _prev_clicks := COALESCE(_link.clicks, 0);

  -- Increment clicks
  UPDATE public.affiliate_links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = _link.id;

  -- Notify on milestones: 1st, 5th, 10th, 25th, 50th, 100th click
  IF _prev_clicks + 1 IN (1, 5, 10, 25, 50, 100, 250, 500, 1000) THEN
    INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
    VALUES (
      _link.user_id,
      CASE 
        WHEN _prev_clicks = 0 THEN '👆 Premier clic sur ton lien !'
        ELSE '🔥 ' || (_prev_clicks + 1) || ' clics sur ton lien !'
      END,
      CASE
        WHEN _prev_clicks = 0 THEN 'Quelqu''un a cliqué sur ton lien ambassadeur ! Continue à partager 🚀'
        ELSE 'Ton lien ambassadeur cartonne ! ' || (_prev_clicks + 1) || ' personnes ont cliqué. Une vente arrive bientôt !'
      END,
      'affiliate_click',
      '/gagner'
    );
  END IF;

  RETURN jsonb_build_object('ok', true, 'clicks', _prev_clicks + 1);
END;
$$;
