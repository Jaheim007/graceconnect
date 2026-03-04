-- Backfill missing partner commissions for ALL completed product purchases
-- where a partner referral exists but no commission was recorded.
-- This fixes the gap where transactions happened before the referral was linked.

DO $$
DECLARE
  _rec record;
  _rate numeric;
  _commission numeric;
BEGIN
  FOR _rec IN
    SELECT pp.paystack_reference, pp.organization_id, pp.platform_fee, pp.currency, pp.completed_at,
           pr.partner_id, p.status as partner_status
    FROM public.product_purchases pp
    JOIN public.partner_referrals pr ON pr.organization_id = pp.organization_id
    JOIN public.partners p ON p.id = pr.partner_id AND p.status = 'approved'
    WHERE pp.status = 'completed'
      AND pp.platform_fee > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.partner_commissions pc
        WHERE pc.payment_reference = pp.paystack_reference
          AND pc.partner_id = pr.partner_id
      )
  LOOP
    _rate := public.get_partner_rate(_rec.partner_id);
    _commission := round((_rec.platform_fee * _rate / 100)::numeric, 2);
    
    IF _commission > 0 THEN
      INSERT INTO public.partner_commissions (partner_id, organization_id, payment_reference, platform_fee_amount, commission_percent, commission_amount, currency, status, payable_at)
      VALUES (
        _rec.partner_id,
        _rec.organization_id,
        _rec.paystack_reference,
        _rec.platform_fee,
        _rate,
        _commission,
        _rec.currency,
        CASE WHEN (_rec.completed_at::timestamptz + interval '15 days') <= now() THEN 'payable' ELSE 'held' END,
        _rec.completed_at::timestamptz + interval '15 days'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  
  -- Also backfill for completed donations where partner referral exists
  FOR _rec IN
    SELECT d.paystack_reference, d.organization_id, d.platform_fee, d.currency, d.completed_at,
           pr.partner_id
    FROM public.donations d
    JOIN public.partner_referrals pr ON pr.organization_id = d.organization_id
    JOIN public.partners p ON p.id = pr.partner_id AND p.status = 'approved'
    WHERE d.status = 'completed'
      AND d.platform_fee > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.partner_commissions pc
        WHERE pc.payment_reference = d.paystack_reference
          AND pc.partner_id = pr.partner_id
      )
  LOOP
    _rate := public.get_partner_rate(_rec.partner_id);
    _commission := round((_rec.platform_fee * _rate / 100)::numeric, 2);
    
    IF _commission > 0 THEN
      INSERT INTO public.partner_commissions (partner_id, organization_id, payment_reference, platform_fee_amount, commission_percent, commission_amount, currency, status, payable_at)
      VALUES (
        _rec.partner_id,
        _rec.organization_id,
        _rec.paystack_reference,
        _rec.platform_fee,
        _rate,
        _commission,
        _rec.currency,
        CASE WHEN (_rec.completed_at::timestamptz + interval '15 days') <= now() THEN 'payable' ELSE 'held' END,
        _rec.completed_at::timestamptz + interval '15 days'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Also update process-transaction to handle donations too (covered by code change)