
-- Seed initial FAQ items for dynamic FAQ page
INSERT INTO public.faq_items (question, answer, category, locale, display_order) VALUES
('Comment créer mon premier produit ?', 'Allez dans votre espace créateur → Produits → Créer un produit. Ajoutez un titre, une description, une image de couverture et votre fichier. Fixez votre prix et publiez !', 'getting_started', 'fr', 1),
('Comment recevoir mes paiements ?', 'Complétez votre vérification KYC (Identité + Selfie) dans Paramètres → Vérification. Une fois approuvé, vos fonds sont libérés après la période de maturation (3 jours pour les ventes, 15 jours pour les commissions affiliés).', 'payments', 'fr', 2),
('Comment fonctionne le programme ambassadeur ?', 'Rejoignez une organisation comme ambassadeur, obtenez votre lien unique, et partagez-le. Vous gagnez une commission sur chaque vente générée via votre lien.', 'ambassador', 'fr', 3),
('Quels sont les frais de la plateforme ?', 'Siteviral prélève 10% de commission sur chaque transaction. Il n''y a aucun abonnement ni frais fixe.', 'payments', 'fr', 4),
('Comment créer un bundle de produits ?', 'Dans votre dashboard, utilisez le Bundle Manager pour sélectionner plusieurs produits et les vendre ensemble à un prix avantageux.', 'products', 'fr', 5),
('Comment utiliser le Studio IA ?', 'Le Studio IA vous permet de créer des livres, ebooks et contenus automatiquement. Accédez-y via Écrire dans le menu principal.', 'features', 'fr', 6),
('Comment contacter le support ?', 'Utilisez le widget d''aide en bas à droite de votre écran. Nos réponses automatiques couvrent les questions fréquentes, et vous pouvez escalader vers un agent si nécessaire.', 'support', 'fr', 7),
('How do I create my first product?', 'Go to your creator space → Products → Create a product. Add a title, description, cover image, and your file. Set your price and publish!', 'getting_started', 'en', 1),
('How do I receive payments?', 'Complete your KYC verification (ID + Selfie) in Settings → Verification. Once approved, your funds are released after the maturation period (3 days for sales, 15 days for affiliate commissions).', 'payments', 'en', 2),
('How does the ambassador program work?', 'Join an organization as an ambassador, get your unique link, and share it. You earn a commission on every sale generated through your link.', 'ambassador', 'en', 3),
('What are the platform fees?', 'Siteviral takes a 10% commission on each transaction. There are no subscriptions or fixed fees.', 'payments', 'en', 4)
ON CONFLICT DO NOTHING;
