INSERT INTO credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, description, display_order, is_active)
VALUES ('ai_lesson_enrich', 'AI Lesson Enrichment', 'ai_content', 2, 5, 'Enrich, expand, or transform a course lesson with AI', 25, true)
ON CONFLICT (action_key) DO NOTHING;