INSERT INTO public.credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, display_order, is_active)
VALUES ('generate_book', 'Génération livre complet', 'studio', 15.0, 28.0, 16, true)
ON CONFLICT (action_key) DO NOTHING;