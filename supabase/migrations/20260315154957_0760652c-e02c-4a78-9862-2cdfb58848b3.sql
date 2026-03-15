INSERT INTO credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, description, display_order, is_active)
VALUES ('ai_course_image', 'Illustration de leçon IA', 'ai_studio', 1.50, 2.50, 'Generate an AI illustration for a course lesson', 15, true)
ON CONFLICT (action_key) DO NOTHING;