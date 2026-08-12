INSERT INTO public.credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, is_active)
VALUES ('import_assemble', 'Import assembly', 'studio', 1, 1, true)
ON CONFLICT (action_key) DO UPDATE
SET action_label = EXCLUDED.action_label,
    category = EXCLUDED.category,
    cost_standard = EXCLUDED.cost_standard,
    cost_premium = EXCLUDED.cost_premium,
    is_active = true;