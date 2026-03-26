INSERT INTO credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, description, display_order, is_active)
VALUES 
  ('ai_module_quiz', 'Génération quiz IA', 'formation', 2.0, 4.0, 'Génération automatique de quiz de fin de module par IA', 20, true),
  ('ai_module_flashcards', 'Génération flashcards IA', 'formation', 1.5, 3.0, 'Génération automatique de flashcards par IA', 21, true)
ON CONFLICT (action_key) DO NOTHING;