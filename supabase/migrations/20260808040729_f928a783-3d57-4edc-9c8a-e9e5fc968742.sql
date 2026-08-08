UPDATE public.credit_action_pricing
SET is_active = true, action_label = 'Couverture IA', cost_standard = 7.50, cost_premium = 12.00
WHERE action_key = 'generate_cover';