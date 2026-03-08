fais moi une liste exhaustive et détaillée de tout ce qui n'a pas été fait et implémenté dans tout ca:
ca:

"Voici le **plan exhaustif et détaillé** pour transformer SiteViral d'un audit en un produit pleinement opérationnel. Aucun code ne sera modifié — tu me dis ce que tu veux implémenter.

---

# 🔧 SITEVIRAL — PLAN DE TRANSFORMATION PRODUIT COMPLET

---

## PARTIE 1 — INCOHÉRENCES & FLUX CASSÉS IDENTIFIÉS

### 1.1 — Code Legacy : `ModeContext` toujours actif

**Problème :** `ModeProvider` enveloppe toute l'app dans `App.tsx`. Il dérive le mode (public/creator/ambassador) depuis la route, query les `affiliate_links` pour chaque utilisateur connecté, et stocke un `preferredMode` en localStorage. Mais la navigation unifiée (sidebar unique avec toutes les sections) rend ce contexte **redondant** — l'UI ne change plus selon le mode.

**Ce qu'il faut faire :**
1. **Auditer tous les imports de `useMode()`** dans le codebase — chercher `useMode` dans tous les fichiers `.tsx/.ts`
2. Pour chaque usage trouvé, vérifier s'il utilise `mode`, `hasCreatorAccess`, `hasAmbassadorAccess`, `toggleMode`, etc.
3. **Remplacer** les usages de `hasCreatorAccess` par une vérification directe via `useOrg()` → `canManage(orgId)`
4. **Remplacer** les usages de `hasAmbassadorAccess` par un hook léger `useHasAffiliateLinks()` qui fait le même query
5. **Supprimer** `ModeProvider` de `App.tsx`
6. **Supprimer** le fichier `src/contexts/ModeContext.tsx`
7. **Supprimer** `isPublicPath()` si elle n'est utilisée nulle part ailleurs (vérifier les imports)

**Risques :** Si certains composants conditionnent leur affichage sur `mode === 'creator'`, ils cesseront de fonctionner. D'où l'importance de l'étape 2.

---

### 1.2 — Plans d'organisation (`OrgPlan`) non appliqués

**Problème :** Le type `OrgPlan` (free/pro/growth/enterprise) existe dans la DB mais **aucune limite** n'est imposée. Un utilisateur en plan `free` peut créer un nombre illimité de produits, campagnes, programmes, etc. Aucune page d'upgrade n'existe.

**Ce qu'il faut faire :**
1. **Définir les limites par plan** :
   - `free` : 3 produits, 1 programme, 2 campagnes, 500 contacts CRM, 1 campagne email/mois, pas de webhooks, pas d'expériences A/B
   - `pro` (9$/mois ou 5 000 FCFA/mois) : 25 produits, 5 programmes, illimité campagnes, 5 000 contacts, 10 campagnes email/mois, webhooks
   - `growth` (29$/mois) : Illimité tout, analytiques avancées, domaine personnalisé (futur), priorité support
   - `enterprise` : Sur devis, marque blanche, API

2. **Créer un hook `usePlanLimits(orgId)`** qui :
   - Fetch le `plan_type` de l'organisation
   - Retourne les limites applicables
   - Expose `canCreate(resourceType)` → boolean
   - Expose `usage(resourceType)` → { current: number, limit: number }

3. **Créer un composant ``** qui :
   - Wraps les boutons de création (Nouveau produit, Nouvelle campagne, etc.)
   - Si la limite est atteinte → affiche un modal d'upgrade au lieu de l'action
   - Le modal montre les avantages du plan supérieur + bouton de paiement

4. **Créer une page `/admin/billing` ou `/admin/plan`** :
   - Montre le plan actuel, l'usage, les limites
   - Boutons d'upgrade avec paiement via Stripe (récurrent)
   - Historique des factures

5. **Migration DB** : Ajouter une colonne `plan_limits_json` sur `organizations` OU utiliser une table `plan_definitions` avec les limites codées

6. **Edge Function** : `upgrade-plan` qui crée une session Stripe Checkout pour l'abonnement

---

### 1.3 — Panneau Admin surchargé (25+ sous-pages)

**Problème :** Un nouveau créateur qui veut juste publier un livre se retrouve avec un menu admin de 25+ entrées. C'est intimidant.

**Ce qu'il faut faire :**
1. **Implémenter une « progressive disclosure » dans la sidebar admin** :
   - **Niveau 1 (toujours visible)** : Tableau de bord, Produits, Studio IA, Paramètres
   - **Niveau 2 (visible si l'org a du contenu)** : Ventes, Analytiques, Membres
   - **Niveau 3 (visible si explicitement activé)** : CRM, Programmes, Webhooks, Expériences, Abonnements

2. **Logique de visibilité** :
   - Compter les produits → si 0, cacher Ventes, Analytiques, Codes promo, Affiliation
   - Vérifier si `affiliation_enabled` → si false, cacher la section Affiliation
   - Vérifier le plan → si free, cacher Webhooks et Expériences (avec badge « Pro »)

3. **Ajouter un bouton « Plus d'outils »** en bas de la sidebar qui révèle les sections cachées

4. **Fichiers à modifier** : Le composant `Sidebar.tsx` (ou `AdminSidebar.tsx`) — ajouter des conditions de visibilité sur chaque `NavItem`

---

### 1.4 — Double routeur Dashboard

**Problème :** `/dashboard` utilise `DashboardRouter` qui redirige selon le rôle (créateur → `/admin`, ambassadeur → `/affiliation`, etc.). Mais avec la navigation unifiée, cette logique est confuse.

**Ce qu'il faut faire :**
1. **Simplifier** : `/dashboard` redirige toujours vers `/feed` (le flux principal)
2. **Ou mieux** : Supprimer la route `/dashboard` et remplacer tous les liens internes qui pointent vers `/dashboard` par `/feed`
3. **Chercher** tous les usages de `/dashboard` dans le codebase et les remplacer
4. **Le `DashboardRouter`** peut être conservé uniquement si des liens externes (emails, etc.) pointent vers `/dashboard` — dans ce cas, il fait un simple redirect vers `/feed`

---

### 1.5 — Pages persona sans maillage interne SEO

**Problème :** 30 pages `/pour/*` + 9 guides `/guide/*` existent mais ne se lient probablement pas entre elles ni vers les pages principales.

**Ce qu'il faut faire :**
1. **Auditer** chaque page persona : ouvrir les fichiers dans `src/pages/persona/` (ou équivalent) et vérifier :
   - Y a-t-il des liens internes vers d'autres pages persona ?
   - Y a-t-il un lien vers `/ecrire`, `/gagner`, `/calculateur` ?
   - Y a-t-il un CTA d'inscription ?
   - Y a-t-il des balises `` et `` uniques ?

2. **Créer un composant `<InternalLinksSection>`** réutilisable qui, en bas de chaque page persona, affiche :
   - 3 pages persona liées (par catégorie similaire)
   - Lien vers le guide le plus pertinent
   - CTA principal (Écrire / Vendre / Gagner selon le persona)

3. **Créer un sitemap dynamique** : Un fichier `public/sitemap.xml` généré qui liste toutes les pages publiques

4. **Ajouter des balises canonical** sur chaque page pour éviter le contenu dupliqué

---

### 1.6 — Avis produits (`useProductReviews`) non intégrés au checkout

**Problème :** Le hook existe, les avis sont probablement stockés, mais la page produit publique (`/org/:slug/product/:id`) ne les affiche peut-être pas de manière visible.

**Ce qu'il faut faire :**
1. **Vérifier** le composant de page produit publique — chercher si `useProductReviews` y est importé
2. **Si absent** : Ajouter une section « Avis clients » sous la description du produit avec :
   - Note moyenne (étoiles)
   - Nombre d'avis
   - Liste des 5 derniers avis avec nom, note, commentaire, date
   - Bouton « Voir tous les avis » si > 5
3. **Ajouter les avis dans le `SmartCTA`** : « ⭐ 4.8/5 — 23 avis » à côté du bouton d'achat
4. **Post-achat** : Dans `PostPurchaseCelebration`, ajouter un bouton « Laisser un avis » qui ouvre un formulaire simple (1-5 étoiles + texte)

---

### 1.7 — Page Témoignages (`/temoignages`) potentiellement statique

**Problème :** Si les témoignages sont codés en dur, ils ne se mettent jamais à jour.

**Ce qu'il faut faire :**
1. **Vérifier** le fichier source de `/temoignages` — est-ce du contenu statique ou dynamique ?
2. **Si statique** : Créer une table `testimonials` en DB avec : `id`, `user_id`, `content`, `rating`, `avatar_url`, `name`, `role`, `is_approved`, `created_at`
3. **Alimenter automatiquement** : Quand un utilisateur laisse un avis 5 étoiles sur un produit, proposer « Voulez-vous que votre avis apparaisse sur notre page témoignages ? »
4. **Edge Function `collect-testimonial`** : Sauvegarde le témoignage en attente d'approbation
5. **Superadmin** : Section pour approuver/rejeter les témoignages
6. **Page `/temoignages`** : Fetch depuis la DB, affiche les témoignages approuvés

---

## PARTIE 2 — FONCTIONNALITÉS DORMANTES À ACTIVER

### 2.1 — Bundles (produits en lot)

**État actuel :** Table `bundle_items` existe, champ `is_bundle` sur `digital_products` existe. Mais aucune UI pour créer un bundle.

**Ce qu'il faut faire :**
1. **Dans `/admin/products` (formulaire de création)** : Ajouter un toggle « Ce produit est un bundle »
2. **Quand activé** : Afficher un sélecteur de produits existants de l'organisation (multi-select)
3. **Au save** : Insérer les entrées dans `bundle_items` avec `bundle_product_id` et `included_product_id`
4. **Page produit publique** : Si `is_bundle`, afficher la liste des produits inclus avec leurs images et descriptions
5. **Au checkout** : Quand un bundle est acheté, créer un `product_purchase` pour chaque produit inclus (donner accès à tous les fichiers)
6. **Prix** : Le prix du bundle est défini manuellement (le créateur choisit un prix inférieur à la somme des parties)

---

### 2.2 — Upsells au checkout

**État actuel :** Les champs `upsell_product_ids` et `order_bump_product_id` existent sur `digital_products`. Aucune UI.

**Ce qu'il faut faire :**
1. **Dans le formulaire produit admin** : Ajouter une section « Ventes additionnelles » avec :
   - **Order Bump** : Sélectionner 1 produit + % de réduction → affiché comme checkbox sur la page de checkout (« Ajoutez X pour seulement Y au lieu de Z »)
   - **Upsell** : Sélectionner 1-3 produits → affichés APRÈS l'achat sur la page de célébration

2. **Page checkout** : Si `order_bump_product_id` est défini :
   - Afficher une card sous le récapitulatif avec le produit bump
   - Checkbox pour l'ajouter
   - Recalculer le montant total si coché
   - Le bump est traité comme une deuxième transaction liée

3. **Page post-achat** : Si `upsell_product_ids` contient des IDs :
   - Afficher « Recommandé pour vous » avec les produits upsell
   - Bouton d'achat direct

4. **Edge Function `process-transaction`** : Supporter le traitement de 2 produits dans une même session (produit principal + bump)

---

### 2.3 — Description de produit par IA

**État actuel :** Edge Function `ai-generate-description` existe. Pas exposée dans l'UI de création de produit.

**Ce qu'il faut faire :**
1. **Dans le formulaire produit** : À côté du champ « Description », ajouter un bouton ✨ « Générer avec l'IA »
2. **Au clic** : Modal qui demande quelques infos (type de produit, audience cible, ton souhaité)
3. **Appel** : `supabase.functions.invoke('ai-generate-description', { body: { title, type, audience, tone } })`
4. **Résultat** : La description générée est insérée dans le champ, l'utilisateur peut l'éditer
5. **Limiter** : 3 générations gratuites par produit, puis proposer un upgrade

---

### 2.4 — Snippets de contenu IA pour les réseaux sociaux

**État actuel :** Edge Function `ai-generate-snippets` existe. Pas exposée.

**Ce qu'il faut faire :**
1. **Après publication d'un produit** : Sur la page de célébration ou dans le `SocialShareKit`, ajouter un bouton « 🤖 Générer des posts sociaux »
2. **Appel** : `supabase.functions.invoke('ai-generate-snippets', { body: { productId } })`
3. **Résultat** : 5 posts pré-rédigés pour WhatsApp, Facebook, Instagram, LinkedIn, TikTok
4. **Chaque post** : Texte + bouton « Copier » + bouton « Partager directement »
5. **Stockage** : Sauvegarder les snippets générés dans une colonne `social_snippets_json` sur `digital_products` pour réutilisation

---

### 2.5 — Relance des paniers abandonnés

**État actuel :** Table `abandoned_carts` existe, `reminder_sent_count` et `last_reminder_at` existent. Le hook existe côté client. Mais le lien avec l'Edge Function d'emails automatisés est incertain.

**Ce qu'il faut faire :**
1. **Vérifier** si l'Edge Function `automated-emails` inclut un cas pour les paniers abandonnés
2. **Si non** : Ajouter dans `automated-emails` un bloc qui :
   - Query les `abandoned_carts` WHERE `converted = false` AND `reminder_sent_count < 3` AND `last_reminder_at < now() - interval '24 hours'` (ou `last_reminder_at IS NULL` AND `created_at < now() - interval '1 hour'`)
   - Pour chaque panier : envoyer un email au `email` avec le nom du produit, l'image de couverture, et un lien direct vers la page d'achat
   - Mettre à jour `reminder_sent_count` et `last_reminder_at`
3. **Template email** : « Vous avez oublié quelque chose ! » avec image du produit, prix, et bouton CTA
4. **Séquence** : Reminder 1 (1h après), Reminder 2 (24h après), Reminder 3 (72h après avec code promo de 10%)
5. **Scheduler** : Le cron Supabase (`pg_cron` ou appel externe) doit invoquer cette edge function toutes les heures

---

### 2.6 — Intégration Canva pour les couvertures

**État actuel :** Edge Functions `canva-auth` et `canva-design` existent, route `/canva/callback` existe. Pas exposé dans le Studio IA.

**Ce qu'il faut faire :**
1. **Dans l'étape Couverture du Studio IA** (étape 7) : Ajouter un troisième choix : « 🎨 Créer avec Canva » (en plus de « Générer par IA » et « Uploader »)
2. **Au clic** : Ouvrir Canva via l'API Canva Button/SDK (ou redirect OAuth)
3. **Au retour** : Le callback `/canva/callback` récupère l'URL de l'image exportée
4. **Sauvegarde** : L'image est uploadée dans Supabase Storage et l'URL est mise dans `cover_image_url`
5. **Vérifier** : Que les secrets Canva (`CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`) sont configurés

---

### 2.7 — Import YouTube

**État actuel :** Edge Function `youtube-channel-import` existe. Pas exposée.

**Ce qu'il faut faire :**
1. **Dans `/admin/media`** : Ajouter un bouton « 📺 Importer depuis YouTube »
2. **Modal** : Champ pour coller l'URL d'une chaîne ou d'une playlist YouTube
3. **Appel** : `supabase.functions.invoke('youtube-channel-import', { body: { url, orgId } })`
4. **Résultat** : La function parse le RSS de la chaîne, crée des entrées `media_content` pour chaque vidéo (titre, description, thumbnail, embed URL)
5. **L'utilisateur** peut ensuite sélectionner quelles vidéos publier
6. **Limites** : Max 50 vidéos par import, plan Pro requis

---

### 2.8 — Système de webhooks exposé

**État actuel :** Page `AdminWebhooks` existe. Mais les webhooks sortants sont-ils réellement envoyés ?

**Ce qu'il faut faire :**
1. **Vérifier** : Est-ce que la table `webhooks` (ou `webhook_endpoints`) existe avec les champs `url`, `events`, `secret`, `is_active` ?
2. **Si oui** : Vérifier que les Edge Functions de paiement (`paystack-webhook`, `stripe-webhook`) déclenchent les webhooks sortants après chaque événement
3. **Si non** : Créer la table et ajouter dans `process-transaction` un bloc qui, après chaque transaction réussie, POST vers toutes les URL webhook de l'organisation avec un payload signé (HMAC)
4. **Events supportés** : `purchase.completed`, `donation.completed`, `affiliate.sale`, `product.published`, `member.joined`
5. **UI Admin** : Formulaire pour ajouter une URL + sélectionner les événements + tester le webhook
6. **Restriction** : Plan Pro minimum

---

## PARTIE 3 — AUTOMATISATION DES TÂCHES D'ÉQUIPE

### 3.1 — Onboarding automatisé (remplace le travail de l'équipe Growth)

**Ce qui existe :** `/welcome` capture l'intention. `OnboardingChecklist` valide les étapes.

**Ce qu'il manque et comment l'automatiser :**

1. **Séquence d'emails drip automatisée** (remplace « contacter manuellement les 10 derniers inscrits ») :
   - **Email J+0** (immédiat) : Bienvenue + lien vers le Studio IA selon l'intention
   - **Email J+1** : « Avez-vous créé votre premier produit ? » + tutoriel vidéo
   - **Email J+3** : « Votre boutique est presque prête ! » + lien direct vers l'étape bloquante
   - **Email J+7** : « Les ambassadeurs vous attendent » + stats de la plateforme
   - **Email J+14** : Si aucune vente → « 3 astuces pour votre première vente »

   **Implémentation :**
   - Table `drip_sequences` : `id`, `trigger_event`, `delay_hours`, `template_name`, `is_active`
   - Table `drip_progress` : `user_id`, `sequence_id`, `step`, `sent_at`, `opened_at`
   - Edge Function `drip-engine` : Invoquée par cron toutes les heures, parcourt les `drip_progress` et envoie le prochain email dû

2. **Visite guidée in-app** (remplace « accueillir personnellement les nouveaux ») :
   - Composant `<OnboardingTour>` utilisant un système de tooltips pas-à-pas
   - Étapes : 1) Voici votre flux → 2) Cliquez ici pour créer → 3) Voici le Studio IA → 4) Voici votre lien ambassadeur
   - Stockage de la progression dans `localStorage` (clé `sv_tour_completed`)
   - Déclenché au premier login après `/welcome`
   - **Librairie suggérée** : Pas de librairie externe — utiliser un composant React maison avec `framer-motion` pour les animations et un overlay semi-transparent

3. **Suggestions contextuelles automatiques** (remplace « envoyer un message personnalisé aux bloqués ») :
   - Hook `useSmartSuggestions()` qui analyse l'état de l'utilisateur :
     - Si 0 produits → « Créez votre premier ebook en 5 min »
     - Si produit sans couverture → « Ajoutez une couverture pour +40% de ventes »
     - Si produit publié mais 0 ventes après 48h → « Partagez votre lien sur WhatsApp »
     - Si ambassadeur avec 0 clics → « Voici 3 astuces pour votre premier partage »
   - Affiché comme bannière dismissible en haut du `/feed` ou dans le dashboard admin

---

### 3.2 — Marketing automatisé (remplace les tâches manuelles de l'équipe Marketing)

1. **Snippets sociaux auto-générés à la publication** :
   - Trigger : Quand `is_published` passe à `true` sur `digital_products`
   - Action : Appeler `ai-generate-snippets` automatiquement
   - Stockage : Colonne `social_snippets_json` sur le produit
   - UI : Le créateur voit « Vos posts sont prêts ! » avec boutons de copie/partage
   - **Cela remplace** : « Préparer les messages WhatsApp de la semaine »

2. **Rapport hebdomadaire auto-généré** :
   - Edge Function `weekly-report` invoquée chaque lundi à 8h UTC par cron
   - Query : Inscriptions de la semaine, ventes, produits publiés, ambassadeurs actifs, top produits
   - Envoie un email formaté aux superadmins
   - **Cela remplace** : « Préparer le rapport hebdomadaire » pour toutes les équipes

3. **Alertes de performance automatiques** :
   - Si le taux de conversion d'une page persona tombe sous 1% → notification superadmin
   - Si un produit a > 100 vues mais 0 achats → notification au créateur avec suggestions
   - Si un ambassadeur a > 50 clics mais 0 conversions → notification avec conseils
   - **Implémentation** : Ajouter ces vérifications dans `motivational-notifications` ou créer `performance-alerts`

---

### 3.3 — Support automatisé (remplace les tâches répétitives du support)

1. **FAQ dynamique auto-alimentée** :
   - Quand un ticket support est résolu avec une catégorie récurrente → proposer au support de « Ajouter à la FAQ »
   - Un bouton dans le superadmin support qui crée automatiquement une entrée FAQ
   - La page `/faq` fetch depuis une table `faq_items` au lieu de contenu statique

2. **Chatbot basique pré-support** :
   - Dans le `FloatingHelpWidget` : Avant d'envoyer un ticket, proposer 5 réponses fréquentes basées sur le contexte (page actuelle)
   - Si l'utilisateur est sur `/admin/kyc` → montrer les questions KYC
   - Si sur `/admin/payouts` → montrer les questions versements
   - Réduire le volume de tickets de 30%+

3. **Auto-résolution KYC** :
   - Quand un document KYC est soumis, vérification automatique basique (le fichier est-il une image ? fait-il plus de 50ko ?) avant de le mettre en « pending »
   - Rejeter automatiquement les soumissions invalides avec un message clair (« Votre fichier est trop petit, veuillez reprendre la photo »)

---

### 3.4 — Communauté automatisée (remplace les tâches manuelles de l'équipe Communauté)

1. **Classement ambassadeurs automatique** :
   - Créer une vue ou query qui classe les ambassadeurs par `total_earned` sur les 7 derniers jours
   - Afficher un **leaderboard** sur `/gagner` (section « 🏆 Top Ambassadeurs cette semaine »)
   - **Cela remplace** : « Publier un classement hebdomadaire des ambassadeurs (top 10) »

2. **Attribution automatique de badges** :
   - Trigger PostgreSQL : Quand `affiliate_sales` est insérée → vérifier si l'ambassadeur a atteint un jalon (1ère vente, 10 ventes, 50 ventes, etc.)
   - Si oui → insérer dans `user_badges` et envoyer une notification
   - **Cela remplace** : « Attribuer les badges aux membres méritants »

3. **Earnings Cards auto-générées** :
   - Quand un ambassadeur atteint un jalon (1000 FCFA gagnés, 5000, 10000, etc.)
   - Générer automatiquement une « Earnings Card » partageable (image avec le montant, le nom, le logo SiteViral)
   - Notification : « 🎉 Tu as gagné X FCFA ! Partage ta réussite → [image] »
   - **Cela remplace** : « Créer des Earnings Cards à partager pour les gagnants de la semaine »

---

### 3.5 — Contenu automatisé (remplace les tâches de l'équipe Contenu)

1. **Blog auto-alimenté par les données plateforme** :
   - Edge Function `auto-blog-draft` : Chaque semaine, générer un brouillon d'article basé sur :
     - Les stats de la semaine (« Cette semaine sur SiteViral : 50 nouveaux livres publiés »)
     - Le produit le plus vendu (étude de cas automatique)
     - Le meilleur ambassadeur (success story)
   - Le brouillon est créé dans la table blog en statut « draft » pour validation humaine

2. **Mise à jour automatique des pages persona** :
   - Injecter les stats en temps réel dans les pages `/pour/*` :
     - « X créateurs comme vous utilisent déjà SiteViral »
     - « Y produits publiés dans votre catégorie »
   - Query les `organizations` par catégorie et les `digital_products` associés

---

## PARTIE 4 — COHÉRENCE PRODUIT (CHAQUE PAGE = SA PROMESSE)

### 4.1 — Vérifications page par page

| Page | Promesse | Vérification nécessaire |
|------|----------|----------------------|
| `/` | « Écris. Vends. Gagne. en 5 min » | ✅ Vérifier que le Studio IA est accessible sans org (sinon créer l'org auto) |
| `/ecrire` | « Écris un livre en 5 min » | ✅ Vérifier que le flux complet fonctionne de bout en bout (idée → PDF publié) |
| `/gagner` | « Gagne de l'argent en partageant » | ✅ Vérifier qu'un nouvel utilisateur peut devenir ambassadeur sans friction |
| `/vendre` | « Vends tes produits numériques » | ✅ Vérifier que la page redirige vers le bon flux (création d'org si nécessaire) |
| `/calculateur` | « Calcule tes revenus potentiels » | ✅ Vérifier que les calculs sont réalistes et cohérents avec les vrais taux de commission |
| `/comparer` | « Compare SiteViral vs concurrents » | ✅ Vérifier que les données des concurrents sont à jour |
| `/devenir-partenaire` | « Deviens partenaire et gagne » | ✅ Vérifier que le formulaire de candidature fonctionne + que le portail `/partner` affiche les bonnes données |
| `/ambassador` | « Programme ambassadeur » | ✅ Vérifier la cohérence avec `/gagner` (pas de duplication) |
| `/discover` | « Découvre toutes les organisations » | ✅ Vérifier qu'il y a du contenu à afficher (sinon, afficher les démo/express) |
| `/blog` | « Articles et tutoriels » | ✅ Vérifier que la table blog a du contenu et que la page n'est pas vide |
| `/faq` | « Réponses à vos questions » | ✅ Vérifier que le contenu est à jour et complet |

### 4.2 — Flux critiques à tester de bout en bout

1. **Flux « Premier livre »** : Inscription → `/welcome` (intention: écrire) → Création d'org auto → `/ecrire` → 11 étapes → PDF généré → Produit publié → Célébration → Partage
   - **Point de friction potentiel** : La création d'org est-elle automatique pour les « auteurs express » ou doivent-ils la créer manuellement ?

2. **Flux « Premier gain ambassadeur »** : Inscription → `/welcome` (intention: gagner) → `/gagner` → Choisir un produit → Devenir ambassadeur (1 clic) → Obtenir le lien → Partager → Quelqu'un achète → Commission visible
   - **Point de friction potentiel** : L'utilisateur doit-il rejoindre l'org avant de pouvoir promouvoir ?

3. **Flux « Premier don reçu »** : Inscription → Création d'org (catégorie église/ONG) → `/admin/campaigns` → Créer une campagne → Publier → Partager le lien → Recevoir un don → Voir le montant dans le dashboard
   - **Point de friction potentiel** : KYC requis avant le premier versement — est-ce communiqué clairement ?

---

## PARTIE 5 — SYSTÈME D'AMÉLIORATION CONTINUE

### 5.1 — Détection automatique d'incohérences

**Edge Function `health-check` (invoquée quotidiennement par cron) :**
```
Vérifications automatiques :
1. Pages orphelines : Produits publiés dont l'org est inactive/suspendue
2. Liens brisés : Produits avec file_url pointant vers un fichier supprimé du storage
3. Prix incohérents : Produits non-gratuits avec price = 0 et is_free = false
4. Couvertures manquantes : Produits publiés sans cover_image_url
5. Ambassadeurs orphelins : affiliate_links dont l'org n'existe plus
6. Emails non délivrés : email_logs avec status = 'failed' des dernières 24h
7. KYC bloqués : kyc_submissions en status 'pending' depuis > 7 jours
8. Organisations sans activité : Orgs créées il y a > 30 jours avec 0 produits et 0 membres (hors owner)
```

**Résultat** : Un rapport quotidien envoyé aux superadmins avec le nombre d'anomalies par catégorie + liens directs pour résoudre.

### 5.2 — Dashboard de santé produit (`/superadmin/health`)

**Nouvelle page superadmin** qui affiche en temps réel :
- ✅ / ⚠️ / ❌ pour chaque système (paiements, emails, IA, storage)
- Nombre de produits avec problèmes de qualité
- Nombre de KYC en attente
- Nombre de versements bloqués
- Taux d'erreur des Edge Functions (via Sentry)
- Dernière exécution de chaque cron job

### 5.3 — Feedback loop utilisateur automatisé

1. **NPS automatique** : Après 30 jours d'utilisation, afficher un micro-sondage (1 question : « Recommanderiez-vous SiteViral ? 0-10 »)
2. **Feedback contextuel** : Après chaque flux majeur (publication, premier don, premier gain), proposer « Comment s'est passée cette expérience ? » (😊😐😞)
3. **Stockage** : Table `user_feedback` avec `user_id`, `context`, `score`, `comment`, `created_at`
4. **Dashboard** : Graphe NPS sur `/superadmin/metrics`

---

## PARTIE 6 — PRÉOCCUPATIONS TECHNIQUES À RÉSOUDRE

### 6.1 — `db` casté en `any`

**Ce qu'il faut faire :**
- Le fichier `src/integrations/supabase/types.ts` est auto-généré et contient les types. Le `db = supabase as any` dans `src/lib/db.ts` bypass tout ça.
- **Solution** : Progressivement remplacer les imports de `db` par `supabase` (typé) dans chaque fichier
- **Étape 1** : Chercher tous les `import { db }` et les lister
- **Étape 2** : Pour chaque fichier, remplacer par `import { supabase }` et corriger les erreurs de type
- **Étape 3** : Une fois tout migré, supprimer `db` de `src/lib/db.ts`
- **Note** : Certaines tables n'existent pas dans les types auto-générés (tables migrées manuellement). Pour celles-ci, utiliser des types manuels dans un fichier `src/types/database-extensions.ts`

### 6.2 — Preuve sociale « bluffée »

**Risque** : Si un utilisateur découvre que les notifications d'achat sont fausses, la confiance est détruite.

**Ce qu'il faut faire :**
1. **Phase 1 (immédiat)** : Ajouter un disclaimer discret dans les conditions d'utilisation : « Certaines données affichées sont des estimations à des fins de démonstration »
2. **Phase 2 (dès qu'il y a de vraies transactions)** : Remplacer progressivement le `FloatingProofToast` simulé par de vraies notifications basées sur les `product_purchases` récentes (anonymisées)
3. **Phase 3** : Supprimer complètement le bluff et ne montrer que des données réelles
4. **Mécanisme de transition** : Un flag `USE_REAL_SOCIAL_PROOF` dans les paramètres superadmin. Quand activé, le toast utilise les vraies données. Quand il n'y a pas assez de données réelles (< 10 transactions/jour), compléter avec les simulées

---

## PARTIE 7 — RÉSUMÉ DES PRIORITÉS PAR IMPACT

| # | Chantier | Impact | Effort | Priorité |
|---|---------|--------|--------|----------|
| 1 | Séquence emails drip (onboarding auto) | 🔥🔥🔥 | Moyen | **P0** |
| 2 | Relance paniers abandonnés | 🔥🔥🔥 | Faible | **P0** |
| 3 | Avis produits sur page d'achat | 🔥🔥 | Faible | **P0** |
| 4 | Suggestions contextuelles in-app | 🔥🔥🔥 | Moyen | **P1** |
| 5 | Limitation par plan (freemium) | 🔥🔥🔥 | Élevé | **P1** |
| 6 | Snippets sociaux auto à la publication | 🔥🔥 | Faible | **P1** |
| 7 | Leaderboard ambassadeurs auto | 🔥🔥 | Faible | **P1** |
| 8 | Bundles | 🔥 | Moyen | **P2** |
| 9 | Upsells au checkout | 🔥🔥 | Moyen | **P2** |
| 10 | Description IA dans le formulaire produit | 🔥 | Faible | **P2** |
| 11 | Suppression ModeContext | 🔧 | Moyen | **P2** |
| 12 | Progressive disclosure sidebar admin | 🔥 | Faible | **P2** |
| 13 | Dashboard santé produit | 🔧 | Moyen | **P3** |
| 14 | Intégration Canva exposée | 🔥 | Moyen | **P3** |
| 15 | Import YouTube exposé | 🔥 | Faible | **P3** |
| 16 | Webhooks fonctionnels | 🔧 | Élevé | **P3** |
| 17 | Rapport hebdomadaire auto | 🔧 | Moyen | **P3** |
| 18 | Visite guidée in-app | 🔥🔥 | Élevé | **P3** |
| 19 | Témoignages dynamiques | 🔥 | Moyen | **P3** |
| 20 | Migration `db` → `supabase` typé | 🔧 | Élevé | **P4** |
| 21 | Transition preuve sociale réelle | 🔧 | Moyen | **P4** |
| 22 | Maillage SEO pages persona | 🔥 | Moyen | **P4** |

---

**Dis-moi quel(s) chantier(s) tu veux que j'implémente en premier — je passe directement au code.**"

et ca:

"Parfait — approche collaborative, rien sans ton feu vert. Voici le plan structuré en **7 chantiers**, classés par priorité. Dis-moi lesquels tu valides, modifies ou rejettes :

---

### 🔴 P0 — Urgences techniques (stabilité)
1. **Nettoyage ModeContext legacy** — supprimer les résidus du contexte obsolète qui polluent le code
2. **Typage strict DB** — remplacer le `db as any` par des types réels pour éviter les bugs silencieux
3. **Overflow global** — audit complet mobile (déjà commencé, à finaliser sur toutes les pages admin)

### 🟠 P1 — Cohérence des parcours utilisateur
4. **Smart Dashboard Router** — redirection intelligente selon le rôle (créateur → admin, ambassadeur → gagner, acheteur → achats)
5. **Simplification admin** — regrouper/nettoyer les 25+ sous-pages, masquer ce qui n'est pas encore actif
6. **États vides travaillés** — chaque page sans données doit guider l'utilisateur (pas un écran blanc)

### 🟡 P2 — Activation des revenus dormants
7. **Limitations OrgPlan** — activer les restrictions free/pro/growth (nombre de produits, médias, etc.)
8. **Bundles & Upsells** — activer les fonctionnalités déjà en base mais non câblées dans l'UI
9. **Preuve sociale** — intégrer les avis/ratings dans le tunnel d'achat

### 🟢 P3 — Automatisation marketing
10. **Drip emails** — séquences automatiques J+0 à J+14 (bienvenue, activation, relance)
11. **Relance paniers abandonnés** — emails automatiques sur `abandoned_carts`
12. **Notifications push motivationnelles** — clics affiliés, premières ventes

### 🔵 P4 — SEO & Distribution
13. **Déploiement Cloudflare Worker** — interception bots sociaux pour OG previews dynamiques
14. **Sitemap dynamique** — génération automatique pour indexation Google
15. **Short links universels** — finaliser sur tous les points de partage

### 🟣 P5 — Studio IA (Phase 1)
16. **Ebook Factory** — création d'ebooks via templates IA + publication en produit
17. **Landing copy generator** — descriptions de vente auto-générées
18. **Covers IA** — génération de couvertures

### ⚪ P6 — Monitoring & Auto-opération
19. **Dashboard santé système** — détection bugs/liens morts côté superadmin
20. **Métriques IA** — tracking jobs, assets, quality scores

---

**Par quoi veux-tu commencer ? Et y a-t-il des chantiers que tu veux retirer, réordonner ou ajouter ?**"

et ca aussi:

"Voici l'analyse exhaustive demandée. C'est un document complet — prends le temps de le lire et dis-moi ce que tu veux implémenter.

---

# 🔧 SITEVIRAL — PLAN DE TRANSFORMATION EXHAUSTIF

## ÉTAPE 1 — INCOHÉRENCES IDENTIFIÉES

### 1.1 Pages obsolètes ou trompeuses

| # | Page/Élément | Problème | Impact |
|---|-------------|----------|--------|
| 1 | **`ModeContext`** | Existe toujours dans `App.tsx`, ajoute de la complexité inutile. Le routing par mode (public/ambassador/creator) est redondant depuis l'unification du layout. | Confusion technique, bundle plus lourd |
| 2 | **Plans OrgPlan (free/pro/growth/enterprise)** | Les types existent en base mais **aucune limitation n'est appliquée**. L'interface affiche "Plan: free" sans chemin d'upgrade. | Promesse non tenue, revenu manqué |
| 3 | **AdminSubscriptions** | La page existe mais le système de facturation récurrente n'est pas connecté à un flux réel (pas de Stripe subscription intégré). | Page morte |
| 4 | **AdminExperiments (A/B)** | La page et le hook `useExperiment` existent mais aucun experiment n'est probablement actif ni piloté. | Fonctionnalité dormante |
| 5 | **AdminWebhooks** | La page existe mais pas d'intégration webhook réelle envoyant des événements aux URL configurées. | Fonctionnalité cosmétique |
| 6 | **AdminWaitlists** | Page + hook existent, mais pas de flux connecté pour les lancements de produits. | Inutilisé |
| 7 | **`/migrer` (Migration Tool)** | La landing page promet l'import depuis d'autres plateformes, mais le flux réel d'import (Gumroad, Selar, etc.) est-il fonctionnel ? | Promesse potentiellement non tenue |
| 8 | **`/comparer` (Comparateur)** | Page statique comparant SiteViral aux concurrents — les données sont-elles à jour ? | Info potentiellement obsolète |
| 9 | **Intégration Canva** | Edge functions `canva-auth` + `canva-design` existent, callback route existe, mais l'accès dans l'UI est invisible. | Fonctionnalité cachée/inutilisée |
| 10 | **Import YouTube** | Edge function `youtube-channel-import` existe mais pas d'interface utilisateur pour l'utiliser dans le Studio. | Code mort |
| 11 | **Livres de coloriage** | Table `coloring_book_projects` existe, mais le flux UI pour créer un livre de coloriage est-il complet ? | Fonctionnalité partielle |
| 12 | **Preuve sociale simulée** | `FloatingProofToast` + `GlobalActivityBar` simulent de fausses activités. Si l'utilisateur découvre que c'est faux, la confiance est détruite. | Risque de réputation majeur |
| 13 | **Codes de parrainage (`referral_code`)** | Chaque profil a un code généré automatiquement, mais le système "Invite & Earn" a été écarté. Les codes ne servent à rien. | Confusion, code mort |
| 14 | **Badges & Gamification** | Table `badges` existe mais — les badges sont-ils attribués automatiquement ? Affichés quelque part ? | Probablement non connecté |
| 15 | **Upsells & Order Bumps** | Champs `upsell_product_ids` et `order_bump_product_id` existent sur `digital_products` mais l'UI de checkout ne les utilise probablement pas. | Revenu manqué |
| 16 | **Bundles** | `is_bundle` + table `bundle_items` existent mais pas d'interface pour créer un bundle dans l'admin. | Fonctionnalité morte |
| 17 | **`is_featured` + `featured_score`** | Existent sur produits et campagnes mais — qui les pilote ? Pas de système pour acheter du placement ou d'algorithme de ranking clair. | Sous-exploité |
| 18 | **Product Reviews** | Hook `useProductReviews` existe mais l'affichage des avis sur la page produit publique est probablement absent ou minimaliste. | Preuve sociale manquante |
| 19 | **Témoignages** | `/temoignages` existe mais probablement du contenu statique, pas des témoignages réels collectés. | Faux social proof |
| 20 | **Content Versioning** | Table `content_versions` existe mais l'UI pour voir/restaurer des versions est absente. | Non exposé |
| 21 | **Watermark Download** | Edge function `watermark-download` existe mais est-elle utilisée dans le flux de téléchargement ? | Probablement pas connecté |
| 22 | **30 pages persona `/pour/*`** | Beaucoup de pages, mais sans maillage interne clair ni tracking de conversion par persona. | SEO dilué |
| 23 | **`/quick-publish`** | Route de publication rapide — est-elle fonctionnelle et accessible depuis le parcours principal ? | Potentiellement caché |
| 24 | **Superadmin AI Chat** | Edge function `superadmin-ai-chat` existe — est-il fonctionnel ? | Fonctionnalité expérimentale |
| 25 | **Récupération paniers abandonnés** | Table `abandoned_carts` + hooks existent mais l'envoi d'email automatique de relance est-il branché ? | Revenu perdu |

### 1.2 Flux cassés ou incomplets

| # | Flux | Problème |
|---|------|----------|
| 1 | **Nouveau utilisateur → Premier produit** | Pas de visite guidée in-app après `/welcome`. L'utilisateur arrive sur le feed ou le dashboard sans guidance claire. |
| 2 | **Créateur → Premier versement** | Le flux KYC → Versement fonctionne-t-il de bout en bout ? Les périodes de maturation (3j produits, 15j affiliés) sont-elles respectées et communiquées ? |
| 3 | **Ambassadeur → Premier gain** | L'ambassadeur sait-il exactement comment partager, sur quel canal, avec quel message ? Le kit marketing est-il pré-généré ? |
| 4 | **Achat → Upsell** | Aucun upsell post-achat malgré les champs en base. |
| 5 | **Panier abandonné → Relance** | Le tracking existe mais l'email automatique n'est pas branché. |
| 6 | **Inscription → Séquence email drip** | L'email de bienvenue existe, mais pas de séquence de nurturing (J+1, J+3, J+7). |
| 7 | **Produit publié → Snippets sociaux auto** | Edge function `ai-generate-snippets` existe mais n'est pas déclenché automatiquement à la publication. |
| 8 | **Fin de formation → Certificat → Partage** | Le flux complet de vérification (`/verify/:certNumber`) existe mais le partage social du certificat est-il déclenché automatiquement ? |
| 9 | **Nouveau produit haute commission → Alerte globale ambassadeurs** | Le trigger `notify_ambassadors_on_product_publish` existe et fonctionne, MAIS les ambassadeurs non-inscrits à cette org spécifique reçoivent-ils l'alerte ? (Oui pour ≥20%, à vérifier en pratique) |
| 10 | **Créateur → CRM → Campagne email** | Le CRM existe mais — les contacts sont-ils automatiquement capturés lors des achats/dons ? |

---

## ÉTAPE 2 — PLAN DE CORRECTION DÉTAILLÉ

### 2.1 Corrections critiques (Impact immédiat)

#### C1. Supprimer/Neutraliser ModeContext
- **Quoi** : Retirer `ModeProvider` de `App.tsx`, remplacer tous les `useMode()` par une logique directe basée sur les routes et `useOrg()`
- **Comment** : 
  1. Lister tous les fichiers importants `useMode()` (recherche globale)
  2. Remplacer par une logique locale (ex: `hasCreatorAccess` → `userOrgs.some(o => canManage(o.id))`)
  3. Supprimer `ModeContext.tsx`
  4. Nettoyer `isPublicPath` si nécessaire (le déplacer dans un utilitaire route)
- **Effort** : Moyen (2-3h)
- **Risque** : Faible si on fait un grep exhaustif

#### C2. Activer les limites par Plan
- **Quoi** : Appliquer des limites concrètes basées sur `plan_type` de l'organisation
- **Comment** :
  1. Créer une migration ajoutant les limites par plan dans une table `plan_limits` ou un JSON de config :
     ```
     free: { max_products: 3, max_programs: 1, max_campaigns: 2, max_email_contacts: 100, ai_generations_per_month: 5 }
     pro: { max_products: 25, max_programs: 5, max_campaigns: 10, max_email_contacts: 1000, ai_generations_per_month: 50 }
     growth: { max_products: unlimited, ... }
     enterprise: { max_products: unlimited, ... }
     ```
  2. Créer une fonction RPC `check_plan_limit(_org_id, _resource_type)` qui vérifie avant chaque création
  3. Ajouter un hook `usePlanLimits(orgId)` côté frontend
  4. Afficher un modal d'upgrade quand la limite est atteinte
  5. Créer la page `/pricing` ou `/upgrade` avec les plans et un checkout Stripe pour l'abonnement mensuel
- **Effort** : Important (1-2 jours)
- **Impact** : **Revenu récurrent direct**

#### C3. Brancher les paniers abandonnés
- **Quoi** : Quand un utilisateur quitte le checkout sans payer, envoyer un email de relance automatique
- **Comment** :
  1. Vérifier que la création dans `abandoned_carts` se fait bien au moment de l'ouverture du checkout
  2. Créer un cron job (via `pg_cron` + edge function) qui tourne toutes les heures
  3. L'edge function sélectionne les paniers non convertis de plus de 1h, envoie un email via Resend avec le lien direct vers le checkout
  4. Mettre à jour `reminder_sent_count` et `last_reminder_at`
  5. Envoyer max 3 rappels : 1h, 24h, 72h
- **Effort** : Moyen (3-4h)
- **Impact** : Récupération de 10-30% des ventes perdues

#### C4. Séquence email d'onboarding (Drip)
- **Quoi** : Après inscription, envoyer une séquence automatique J+0, J+1, J+3, J+7
- **Comment** :
  1. Créer une table `email_drip_events` pour tracker quels emails ont été envoyés à quel utilisateur
  2. Edge function `drip-emails` appelée par cron toutes les heures
  3. Séquence :
     - **J+0** : Bienvenue + "Écris ton premier livre en 5 min" (lien vers `/ecrire`)
     - **J+1** : "Tu n'as pas encore créé de produit ? Voici comment" (si pas de produit)
     - **J+3** : "Savais-tu que tu peux gagner en partageant ?" (programme ambassadeur)
     - **J+7** : "Des créateurs comme toi ont déjà gagné X FCFA" (preuve sociale + urgence)
  4. Chaque email contient un CTA précis et est conditionné par l'activité de l'utilisateur
- **Effort** : Moyen (4-5h)
- **Impact** : Augmentation significative de l'activation

#### C5. Connecter les Upsells au checkout
- **Quoi** : Après un achat, proposer le produit `order_bump_product_id` et les `upsell_product_ids`
- **Comment** :
  1. Sur la page de confirmation d'achat (`/success`), récupérer le produit acheté
  2. Si `order_bump_product_id` existe, afficher un "Ajouter aussi..." avec prix réduit (`order_bump_discount_percent`)
  3. Si `upsell_product_ids` existent, afficher "Les clients ont aussi acheté..."
  4. Ajouter l'interface dans l'admin pour que le créateur puisse configurer ses upsells
- **Effort** : Moyen (3-4h)
- **Impact** : +15-30% de panier moyen

#### C6. Activer les Bundles
- **Quoi** : Permettre aux créateurs de créer des packs de produits
- **Comment** :
  1. Dans `/admin/products`, ajouter un bouton "Créer un Bundle"
  2. Interface pour sélectionner les produits à inclure, définir un prix bundle (< somme des prix individuels)
  3. Insérer dans `digital_products` avec `is_bundle = true` + remplir `bundle_items`
  4. Sur la page produit publique, afficher les produits inclus dans le bundle
  5. À l'achat, donner accès à tous les produits du bundle
- **Effort** : Moyen (4-5h)
- **Impact** : Augmentation du panier moyen

#### C7. Afficher les avis produits sur la page d'achat
- **Quoi** : Rendre visibles les avis clients sur la page produit publique
- **Comment** :
  1. Vérifier que `useProductReviews` récupère bien les avis
  2. Ajouter un composant `ProductReviews` sur la page `/org/:slug/product/:id`
  3. Afficher les étoiles, le nombre d'avis, et les 3 avis les plus récents
  4. Ajouter un formulaire "Laisser un avis" post-achat (uniquement pour les acheteurs vérifiés)
  5. Email automatique J+3 après achat : "Comment avez-vous trouvé ce produit ?"
- **Effort** : Moyen (3-4h)
- **Impact** : Augmentation de la conversion de 15-25%

### 2.2 Corrections importantes (Moyen terme)

#### C8. Visite guidée in-app (Onboarding Tour)
- **Quoi** : Après `/welcome`, guider l'utilisateur étape par étape
- **Comment** :
  1. Le composant `OnboardingTour` existe déjà dans `AdminShell` — l'étendre
  2. Créer des étapes contextuelles :
     - Créateur : "Voici le Studio IA" → "Créez votre premier produit" → "Fixez votre prix" → "Publiez"
     - Ambassadeur : "Voici la Marketplace" → "Choisissez un produit" → "Obtenez votre lien" → "Partagez"
  3. Persister l'état du tour dans `profiles` (champ `onboarding_completed_steps` JSON)
  4. Afficher une checklist persistante jusqu'à complétion (comme `FirstWinChecklist`)
- **Effort** : Moyen (4-5h)

#### C9. Supprimer ou remplacer la preuve sociale simulée
- **Quoi** : Remplacer les faux toasts par des données réelles
- **Comment** :
  1. Option A : Remplacer `FloatingProofToast` par un composant qui query les vraies dernières transactions (anonymisées : "Quelqu'un au Sénégal vient d'acheter...")
  2. Option B : Supprimer complètement et le remplacer par des compteurs réels ("127 produits vendus cette semaine")
  3. `GlobalActivityBar` : afficher les vraies stats agrégées au lieu de données simulées
- **Effort** : Faible (1-2h)
- **Impact** : Intégrité de la marque

#### C10. Nettoyer les referral_code inutilisés
- **Quoi** : Le trigger `generate_referral_code` crée des codes pour chaque profil mais ils ne servent à rien
- **Comment** :
  1. Option A : Supprimer le trigger et la colonne (si "Invite & Earn" est définitivement écarté)
  2. Option B : Réutiliser les codes comme identifiant court du profil public
- **Effort** : Faible (30 min)

#### C11. Exposer l'intégration Canva
- **Quoi** : Permettre aux créateurs de designer leurs couvertures via Canva
- **Comment** :
  1. Dans le Studio IA, à l'étape "Couverture", ajouter un bouton "Designer avec Canva"
  2. Déclencher le flux OAuth Canva existant
  3. Récupérer le design exporté et l'utiliser comme `cover_image_url`
- **Effort** : Moyen (3-4h) — le backend est prêt

#### C12. Exposer l'import YouTube
- **Quoi** : Permettre d'importer une chaîne YouTube comme bibliothèque de contenu
- **Comment** :
  1. Dans le Studio IA, ajouter une source "YouTube Channel"
  2. L'utilisateur colle l'URL de sa chaîne
  3. L'edge function `youtube-channel-import` récupère les vidéos
  4. Chaque vidéo est convertie en média (`media_content`) ou en source pour un livre
- **Effort** : Moyen (3-4h)

#### C13. Activer les snippets sociaux automatiques
- **Quoi** : Quand un produit est publié, générer automatiquement des posts sociaux
- **Comment** :
  1. Dans le trigger `notify_ambassadors_on_product_publish` (ou un nouveau trigger), appeler `ai-generate-snippets`
  2. Stocker les snippets générés dans une table ou dans `digital_products.metadata`
  3. Afficher les snippets pré-rédigés dans le kit de partage social du produit
  4. Les ambassadeurs ont juste à copier-coller
- **Effort** : Moyen (3h)

#### C14. Compléter le flux de certificats
- **Quoi** : Fin de formation → Certificat → Partage social automatique
- **Comment** :
  1. Vérifier que la complétion de toutes les leçons d'un programme déclenche la génération d'un certificat
  2. Afficher un écran de célébration avec confettis + boutons de partage (LinkedIn, WhatsApp, Facebook)
  3. Le lien partagé (`/verify/:certNumber`) doit avoir des OG meta riches via `share-meta`
- **Effort** : Moyen (3h)

#### C15. Auto-capture des contacts dans le CRM
- **Quoi** : Chaque acheteur/donateur est automatiquement ajouté dans les contacts de l'organisation
- **Comment** :
  1. Dans `process-transaction.ts`, après un achat/don réussi, insérer dans `contacts` si le contact n'existe pas
  2. Ajouter le tag automatique `buyer` ou `donor`
  3. Le créateur voit immédiatement ses clients dans `/admin/crm`
- **Effort** : Faible (1-2h)
- **Impact** : Le CRM se remplit automatiquement, pas besoin d'import manuel

---

## ÉTAPE 3 — AUTOMATISATION DES TÂCHES D'ÉQUIPE

### 3.1 Créer un "Centre de Commande" (`/superadmin/command-center`)

**Concept** : Une page dans le superadmin qui remplace les rituels manuels des équipes. Chaque section correspond à une équipe et affiche automatiquement les actions à faire.

#### 3.1.1 Section Marketing

| Tâche manuelle actuelle | Automatisation proposée |
|------------------------|------------------------|
| Vérifier analytics | Widget auto avec top 3 pages persona + tendances semaine |
| Créer visuels sociaux | Bouton "Générer Earnings Card" et "Générer Success Story Card" avec données réelles |
| Préparer messages WhatsApp | Générateur automatique de messages marketing pré-rédigés basés sur les derniers produits/succès |
| Analyser conversions | Tableau automatique : taux de conversion par page d'accueil, par source |
| Rapport hebdomadaire | Rapport auto-généré chaque lundi à 9h, envoyé par email |

**Comment implémenter** :
1. Créer une page `/superadmin/command-center` avec des onglets par équipe
2. Chaque onglet query les données pertinentes et affiche des "Action Cards"
3. Une Action Card = Titre + Données + Bouton d'action (ex: "Envoyer", "Publier", "Contacter")
4. Edge function `weekly-report` (cron lundi 9h) qui compile les métriques et envoie un email digest

#### 3.1.2 Section Growth

| Tâche manuelle | Automatisation |
|---------------|---------------|
| Vérifier TTFV/TTFS | Calcul automatique affiché en temps réel |
| Identifier points de friction | Funnel d'onboarding visuel avec taux de drop-off par étape |
| Contacter les inscrits bloqués | Liste auto des users inscrits depuis >24h sans action + bouton "Envoyer nudge" |
| Paniers abandonnés | Compteur + liste + bouton "Envoyer relance" (ou automatique si C3 implémenté) |
| Rapport K-Factor | Calcul auto : (invitations envoyées × taux conversion) / utilisateurs actifs |

**Données à calculer automatiquement** :
- **TTFV** : `AVG(first_action_at - created_at)` depuis `profiles` (nécessite d'ajouter un champ `first_action_at`)
- **TTFS** : `AVG(first_sale_at - created_at)` (nécessite un champ ou une query sur `product_purchases`)
- **K-Factor** : `(total_affiliate_clicks × conversion_rate) / total_active_users`
- **Funnel** : Inscription → Profile complété → Org créée → Produit créé → Produit publié → Première vente

#### 3.1.3 Section Partenariats

| Tâche manuelle | Automatisation |
|---------------|---------------|
| Identifier prospects | Liste des nouvelles organisations avec trafic élevé mais sans partenaire |
| Pipeline candidatures | Tableau des candidatures en attente avec actions (approuver/rejeter) — existe déjà dans `/superadmin/partners` |
| Célébrer progressions | Notification auto quand un partenaire change de niveau |
| Revenu par partenaire | Dashboard auto avec revenu mensuel par partenaire (query `partner_commissions`) |

#### 3.1.4 Section Support

| Tâche manuelle | Automatisation |
|---------------|---------------|
| Traiter tickets | Le support pourrait être partiellement automatisé avec un chatbot FAQ |
| KYC en attente | Liste avec un compteur et des boutons d'action (existe déjà) |
| Problèmes de paiement | Détection auto des paiements échoués avec contexte (gateway, montant, erreur) |
| FAQ | Auto-détection des questions fréquentes à partir des tickets support |

**Proposition** : Créer un composant `SmartSupportWidget` qui :
1. Avant de soumettre un ticket, cherche dans la FAQ existante
2. Propose des solutions automatiques basées sur le type de problème
3. N'escalade vers l'humain que si nécessaire

#### 3.1.5 Section Communauté

| Tâche manuelle | Automatisation |
|---------------|---------------|
| Classement ambassadeurs | Calcul auto hebdomadaire + publication automatique |
| Collecte témoignages | Email auto après jalons (5 ventes, 10 000 FCFA gagnés) demandant un témoignage |
| Attribution badges | Trigger auto : quand un utilisateur atteint un palier → attribution du badge + notification |
| Défis hebdomadaires | Système de missions auto-générées basées sur l'activité de la semaine |

#### 3.1.6 Section Contenu

| Tâche manuelle | Automatisation |
|---------------|---------------|
| Recherche mots-clés | Intégrer une suggestion basée sur les recherches des utilisateurs (`client_events` avec `event_name = 'search'`) |
| Publication blog | Éditeur intégré dans le superadmin (ou dans l'admin avec un flag "blog post") |
| Snippets sociaux | Génération automatique via `ai-generate-snippets` pour chaque nouveau produit |
| Tutoriels | Proposer automatiquement des sujets basés sur les features les moins utilisées |

### 3.2 Automatisations sans interface (Backend only)

| # | Automatisation | Mécanisme | Cron/Trigger |
|---|---------------|-----------|------------|
| A1 | **Email drip onboarding** | Edge function + `pg_cron` toutes les heures | Cron |
| A2 | **Relance paniers abandonnés** | Edge function + `pg_cron` toutes les heures | Cron |
| A3 | **Rapport hebdomadaire** | Edge function envoyant un digest chaque lundi 9h | Cron |
| A4 | **Attribution auto de badges** | Trigger PostgreSQL sur `product_purchases`, `affiliate_sales`, `program_enrollments` | Trigger |
| A5 | **Auto-ajout contact CRM** | Trigger sur `product_purchases` et `donations` | Trigger |
| A6 | **Calcul K-Factor quotidien** | Edge function dans `aggregate-metrics` | Cron existant |
| A7 | **Nettoyage codes referral inutilisés** | Migration pour supprimer la colonne ou le trigger | One-shot |
| A8 | **Snippets sociaux auto** | Trigger sur `digital_products.is_published = true` → appel edge function | Trigger |
| A9 | **Email post-achat "Laissez un avis"** | Edge function déclenché 3 jours après achat via cron | Cron |
| A10 | **Release commissions maturées** | Fonctions `release_matured_affiliate_sales` et `release_matured_partner_commissions` existent — vérifier qu'elles sont appelées par cron | Cron |
| A11 | **Détection des créateurs inactifs** | Cron quotidien : users avec org mais 0 produits depuis >7j → nudge email | Cron |
| A12 | **Détection des ambassadeurs inactifs** | Cron quotidien : users avec liens affiliés mais 0 clics depuis >7j → nudge email | Cron |

---

## ÉTAPE 4 — PRODUIT AUTO-OPÉRÉ

### 4.1 Guidance automatique des utilisateurs

| Moment | Action automatique | Comment |
|--------|-------------------|---------|
| **Post-inscription** | Tour guidé contextuel | `OnboardingTour` étendu avec étapes adaptées au rôle choisi sur `/welcome` |
| **0 produit après 24h** | Notification push + email | "Tu n'as pas encore créé ton premier produit. C'est gratuit et ça prend 5 min ! 🚀" |
| **Produit créé mais non publié** | Notification in-app | "Ton produit est prêt ! Publie-le pour commencer à gagner." |
| **Produit publié, 0 vente après 48h** | Suggestion d'actions | "Partage ton produit sur WhatsApp pour tes premiers acheteurs" + kit de partage pré-rempli |
| **Première vente** | Célébration + suggestion | Confettis + "Bravo ! 🎉 Active le programme ambassadeur pour que d'autres vendent pour toi." |
| **5 ventes** | Nudge upgrade | "Tu as atteint 5 ventes ! Passe au plan Pro pour vendre illimité." |
| **Ambassadeur : 0 clic après 48h** | Conseils de partage | "Voici 3 astuces pour avoir plus de clics sur ton lien..." |
| **Ambassadeur : 10 clics, 0 conversion** | Conseil ciblé | "Tes clics ne convertissent pas ? Essaie de cibler des groupes intéressés par [catégorie du produit]" |
| **Fin de formation** | Certificat + partage auto | Écran de célébration avec partage LinkedIn/WhatsApp |

### 4.2 Suggestions de croissance automatiques

Créer un composant `GrowthSuggestions` qui apparaît dans le dashboard et dans l'admin, basé sur l'état actuel :

| État détecté | Suggestion affichée |
|-------------|-------------------|
| 0 produits | "Écris ton premier livre en 5 min →" |
| 1 produit, 0 vente | "Partage ton produit sur WhatsApp →" |
| Ventes mais pas d'ambassadeurs | "Active l'affiliation pour démultiplier tes ventes →" |
| Ambassadeurs actifs mais commission < 15% | "Augmente ta commission à 20% pour attirer plus d'ambassadeurs →" |
| >10 ventes, pas de formation | "Crée une formation pour fidéliser tes clients →" |
| CRM vide | "Tes acheteurs ne sont pas dans ton CRM. Active la capture auto →" |
| Pas de campagne email | "Envoie une newsletter à tes clients →" |
| KYC non soumis | "Complète ton KYC pour recevoir tes versements →" |
| Description produit < 100 caractères | "Améliore ta description pour plus de ventes →" |
| Pas d'image de couverture | "Ajoute une couverture pour tripler tes conversions →" |

**Implémentation** :
1. Hook `useGrowthSuggestions(orgId)` qui évalue les conditions
2. Composant `GrowthSuggestionsBanner` dans le dashboard admin
3. Max 2 suggestions affichées à la fois (rotation basée sur priorité)
4. Chaque suggestion a un bouton d'action direct

### 4.3 Marketing automatique

| Action automatique | Déclencheur | Résultat |
|-------------------|------------|---------|
| **Snippets sociaux** | Publication d'un produit | 5 messages pré-rédigés (WhatsApp, FB, Twitter, LinkedIn, Telegram) générés par IA |
| **Earnings Card** | Ambassadeur atteint un palier | Image partageable avec les gains (anonymisé si souhaité) |
| **Success Story template** | Créateur atteint 10 ventes | Template d'histoire de succès pré-rempli |
| **Digest ambassadeur** | Quotidien 8h UTC | ✅ Déjà implémenté |
| **Alerte haute commission** | Nouveau produit ≥20% | ✅ Déjà implémenté |
| **Email de bienvenue** | Inscription | ✅ Déjà implémenté |
| **Email drip J+1, J+3, J+7** | Post-inscription | À implémenter (A1) |
| **Email relance panier** | Panier abandonné >1h | À implémenter (A2) |
| **Email demande d'avis** | J+3 après achat | À implémenter (A9) |

### 4.4 Promotions automatiques

Créer un système de "Smart Promotions" :
1. **Détection auto** : Produits avec beaucoup de vues mais peu d'achats → suggérer au créateur de créer un code promo
2. **Promo temporaire auto** : Le créateur peut activer "Offre flash 24h" en 1 clic (crée automatiquement un `promo_code` avec expiration)
3. **Alerte ambassadeurs** : Quand une promo est créée, notifier les ambassadeurs de l'org

---

## ÉTAPE 5 — IMPLÉMENTATIONS CONCRÈTES

### 5.1 Priorité 1 — Impact immédiat (Semaine 1)

| # | Tâche | Fichiers | Effort |
|---|-------|---------|--------|
| I1 | Remplacer preuve sociale simulée par données réelles | `FloatingProofToast.tsx`, `GlobalActivityBar.tsx` | 2h |
| I2 | Auto-capture contacts CRM | Trigger SQL sur `product_purchases` et `donations` → insert `contacts` | 1h |
| I3 | Afficher avis produits sur page publique | Page produit publique + `ProductReviews` composant | 3h |
| I4 | Brancher paniers abandonnés | Edge function + cron + email template | 4h |
| I5 | Suggestions de croissance (GrowthSuggestionsBanner) | Hook + composant dans admin dashboard | 3h |

### 5.2 Priorité 2 — Revenus (Semaine 2)

| # | Tâche | Fichiers | Effort |
|---|-------|---------|--------|
| I6 | Limites par plan + page upgrade | Migration + hook + modal + page pricing | 8h |
| I7 | Upsells au checkout | Page success + admin UI pour configurer | 4h |
| I8 | Bundles dans l'admin | Admin products + création bundle UI | 5h |
| I9 | Email drip onboarding | Edge function + cron + 4 templates | 5h |

### 5.3 Priorité 3 — Activation (Semaine 3)

| # | Tâche | Fichiers | Effort |
|---|-------|---------|--------|
| I10 | Tour guidé in-app étendu | `OnboardingTour` + persistence profil | 4h |
| I11 | Snippets sociaux auto à la publication | Trigger + appel `ai-generate-snippets` | 3h |
| I12 | Attribution auto de badges | Triggers SQL sur paliers | 3h |
| I13 | Email "Laissez un avis" J+3 | Edge function + cron | 2h |
| I14 | Supprimer ModeContext | Refactoring global | 3h |

### 5.4 Priorité 4 — Polissage (Semaine 4)

| # | Tâche | Fichiers | Effort |
|---|-------|---------|--------|
| I15 | Centre de Commande superadmin | Nouvelle page `/superadmin/command-center` | 8h |
| I16 | Exposer intégration Canva | Bouton dans Studio IA | 3h |
| I17 | Exposer import YouTube | Interface dans Studio IA | 3h |
| I18 | Rapport hebdomadaire auto | Edge function cron lundi 9h | 3h |
| I19 | Nettoyer referral_code | Migration suppression | 30min |
| I20 | Activer le watermark download | Connecter dans le flux de téléchargement | 2h |

---

## ÉTAPE 6 — COHÉRENCE DU PRODUIT

### Vérification page par page

| Page | Promesse | Réalité | Action |
|------|---------|---------|--------|
| `/` | "Écris. Vends. Gagne." | ✅ Fonctionne | Remplacer stats simulées par vraies stats |
| `/ecrire` | Livre IA en 5 min | ✅ Fonctionne | Ajouter source YouTube + Canva cover |
| `/gagner` | Gagner en partageant | ✅ Fonctionne | Ajouter snippets pré-générés par produit |
| `/vendre` | Vendre facilement | ⚠️ Pas de guidance | Ajouter onboarding tour |
| `/discover` | Découvrir des produits | ✅ Fonctionne | Ajouter avis + badge "Tendance" basé sur vrai `featured_score` |
| `/admin/products` | Gérer les produits | ⚠️ Pas de bundles, pas d'upsells configurables | Ajouter UI bundle + upsell |
| `/admin/subscriptions` | Abonnements | ❌ Page morte | Connecter à Stripe Subscriptions ou masquer |
| `/admin/experiments` | Tests A/B | ⚠️ Fonctionnel mais inutilisé | Documenter + pré-créer des experiments |
| `/admin/webhooks` | Intégrations | ⚠️ Fonctionnel mais sans envoi réel | Implémenter l'envoi d'événements webhook |
| `/admin/waitlists` | Listes d'attente | ⚠️ Interface sans flux connecté | Connecter au lancement de produits |
| `/migrer` | Import depuis d'autres plateformes | ⚠️ Vérifier si le flux est complet | Tester et compléter |
| `/comparer` | Comparaison concurrents | ⚠️ Données potentiellement obsolètes | Mettre à jour les données |
| `/temoignages` | Témoignages clients | ⚠️ Probablement statique | Connecter aux vrais témoignages collectés |
| `/calculateur` | Calculer ses revenus | ✅ Probablement fonctionnel | Vérifier les formules |
| Toutes pages `/pour/*` | SEO ciblé | ⚠️ 30 pages sans maillage interne clair | Ajouter liens internes entre pages |

### Règles de cohérence à appliquer

1. **Aucune page ne doit mentionner une fonctionnalité qui ne fonctionne pas**
2. **Chaque CTA doit mener à un flux complètement fonctionnel**
3. **Les stats affichées doivent être réelles ou clairement marquées comme exemples**
4. **Les pages dormantes doivent être masquées ou complétées**

---

## ÉTAPE 7 — SYSTÈME D'AMÉLIORATION CONTINUE

### 7.1 Détection automatique d'incohérences

Créer une edge function `platform-health-check` (cron quotidien) qui vérifie :

| Vérification | Query | Alerte si |
|-------------|-------|----------|
| Pages mortes | Compter les pages admin avec 0 interactions en 30j | > 5 pages sans usage |
| Produits sans ventes | Produits publiés depuis >30j avec 0 ventes | > 20% des produits |
| Ambassadeurs inactifs | Liens affiliés avec 0 clics depuis >30j | > 50% inactifs |
| Orgs sans contenu | Organisations créées depuis >7j avec 0 produits | > 40% |
| KYC en attente | Soumissions KYC en statut "pending" depuis >48h | > 0 |
| Paniers abandonnés non relancés | `abandoned_carts` sans `last_reminder_at` | > 10 |
| Conversions en baisse | Taux de conversion semaine N vs N-1 | Baisse > 10% |
| Erreurs edge functions | Logs d'erreurs des dernières 24h | > 10 erreurs |

**Résultat** : Un email digest quotidien au superadmin avec un "score de santé" de la plateforme (0-100) et les actions prioritaires.

### 7.2 Système de suggestions d'amélioration

Dans le Centre de Commande (`/superadmin/command-center`), une section "💡 Améliorations suggérées" qui analyse :

1. **Funnel d'activation** : Si le drop-off est fort à une étape, suggérer un A/B test
2. **Produits les plus vus mais pas achetés** : Suggérer d'ajouter une promo ou d'améliorer la description
3. **Canaux de partage les plus performants** : Suggérer de doubler l'effort sur ce canal
4. **Heures de pointe** : Suggérer les meilleurs moments pour publier

### 7.3 Tableau de bord de santé produit

Un widget permanent dans le superadmin dashboard :

```
🟢 Santé plateforme : 78/100
├── 🟢 Paiements : 95/100 (0 échecs non résolus)
├── 🟡 Activation : 62/100 (TTFV moyen = 4min, objectif = 1min)  
├── 🟢 Rétention : 80/100 (J7 = 45%)
├── 🟡 Viralité : 65/100 (K-Factor = 1.2, objectif = 1.5)
├── 🟢 Contenu : 88/100 (95% produits avec couverture)
└── 🔴 Support : 40/100 (3 KYC en attente >48h)
```

### 7.4 Feedback loop automatisé

| Moment | Feedback collecté | Usage |
|--------|------------------|-------|
| Post-achat | NPS (1-10) + commentaire optionnel | Améliorer les pages produits |
| Post-publication | "Comment s'est passée la publication ?" | Améliorer le Studio IA |
| Post-versement | "Avez-vous reçu vos fonds ?" | Valider le flux paiement |
| J+30 après inscription | "Recommanderiez-vous SiteViral ?" | Score NPS global |
| Churn détecté (inactif 30j) | "Pourquoi êtes-vous parti ?" | Identifier les problèmes |

---

## RÉSUMÉ DES PRIORITÉS

### 🔴 Urgence maximale (Revenu + Confiance)
1. Remplacer preuve sociale simulée par données réelles
2. Limites par plan + page upgrade (revenu récurrent)
3. Paniers abandonnés → relance email
4. Avis produits visibles sur page d'achat

### 🟠 Haute priorité (Activation + Rétention)
5. Email drip onboarding (J+0 à J+7)
6. Suggestions de croissance automatiques
7. Upsells + Bundles
8. Auto-capture contacts CRM

### 🟡 Priorité moyenne (Polissage)
9. Tour guidé in-app étendu
10. Snippets sociaux auto
11. Centre de Commande superadmin
12. Supprimer ModeContext

### 🟢 Nice to have
13. Intégration Canva exposée
14. Import YouTube exposé
15. Rapport hebdomadaire auto
16. Watermark download activé
17. Score de santé plateforme

---

**Dis-moi ce que tu veux implémenter en premier, et dans quel ordre, et j'exécute.**"

et finalement, ca aussi:

"Parfait, je lance l'audit complet. Je vais lire le code réel de chaque zone identifiée. Commençons par les fichiers clés — je vais les lire en parallèle par lots.

Now let me check the remaining critical pages and components:

J'ai maintenant une vision complète du code réel. Voici le **plan exhaustif à 200%, mis à jour après audit du code** :

---

# 🔧 SITEVIRAL — PLAN DE TRANSFORMATION EXHAUSTIF v2 (POST-AUDIT CODE)

---

## ÉTAPE 1 — INCOHÉRENCES IDENTIFIÉES (VÉRIFIÉES DANS LE CODE)

### 1.1 Pages/Fonctionnalités MORTES ou COSMÉTIQUES

| # | Élément | Verdict après audit code | Gravité |
|---|---------|------------------------|---------|
| 1 | **ModeContext** | ✅ CONFIRMÉ — Existe dans `App.tsx`, contient logique complexe (modes public/ambassador/creator) qui pourrait être simplifiée. 157 lignes. | 🟡 Dette technique |
| 2 | **OrgPlan (free/pro/growth)** | ✅ CONFIRMÉ — Le type existe en DB (`plan_type`) mais **aucune vérification de limite nulle part dans le code**. | 🔴 Revenu manqué |
| 3 | **AdminSubscriptions** | ⚠️ PARTIELLEMENT FONCTIONNEL — L'interface CRUD plans/abonnés/MRR est complète (359 lignes). MAIS : pas de flux de paiement réel. Les utilisateurs ne peuvent pas s'abonner via checkout. C'est juste un gestionnaire de plans sans stripe/paystack subscription intégré. | 🟠 Fonctionnalité incomplète |
| 4 | **AdminExperiments** | ✅ FONCTIONNEL — CRUD complet sur table `experiments`, toggle on/off, variantes. Le hook `useExperiment` existant peut le consommer. **Mais aucun experiment n'est probablement actif.** | 🟢 Fonctionnel mais inutilisé |
| 5 | **AdminWebhooks** | ⚠️ PARTIELLEMENT FONCTIONNEL — Sauvegarde l'URL + événements dans `organizations.webhook_url`. Le test envoie un POST. **MAIS : aucun code backend n'envoie réellement de webhook lors d'une vente/don/inscription.** Le `fetch(url, { mode: 'no-cors' })` ne vérifie même pas la réponse. | 🟠 Fonctionnel côté UI mais non branché côté backend |
| 6 | **AdminWaitlists** | ✅ FONCTIONNEL — CRUD complet, entrées avec export CSV. 170 lignes. Fonctionne mais probablement inutilisé. | 🟢 Fonctionnel |
| 7 | **AdminPayouts** | ✅ FONCTIONNEL — Affiche résumé financier, Stripe Connect onboarding, historique des payouts, export CSV. 295 lignes. Bien construit. | 🟢 Fonctionnel |
| 8 | **AdminNotifications** | ✅ FONCTIONNEL — Envoi push via `send-push` edge function, historique, analytics avec taux de lecture. 246 lignes. | 🟢 Fonctionnel |
| 9 | **AdminOfferings** | ✅ FONCTIONNEL — CRUD complet pour les types de dons (dîmes, offrandes), montants prédéfinis, récurrence. 336 lignes. | 🟢 Fonctionnel |
| 10 | **AdminPhotos** | ✅ FONCTIONNEL — Upload, légendes, publish/unpublish, suppression. 183 lignes. | 🟢 Fonctionnel |
| 11 | **AdminMedia** | ✅ FONCTIONNEL — Liste médias, suppression, navigation vers création. Utilise `useOrgMedia`. | 🟢 Fonctionnel |
| 12 | **AdminPrograms** | ✅ FONCTIONNEL — Liste programmes, suppression, navigation vers création. Utilise `useOrgPrograms`. | 🟢 Fonctionnel |
| 13 | **AdminAnalytics** | ✅ TRÈS COMPLET — 575 lignes, avec graphiques (AreaChart, PieChart, LineChart), rétention par cohorte, funnel de conversion, revenue par canal. | 🟢 Fonctionnel |

### 1.2 Pages Superadmin (VÉRIFIÉES)

| # | Page | Verdict | Gravité |
|---|------|---------|---------|
| 14 | **SuperadminSupport** | ✅ FONCTIONNEL — Tickets avec statut, priorité, réponse admin, email de notification. 252 lignes. Dépend de table `support_tickets`. | 🟢 |
| 15 | **SuperadminInvestorSnapshot** | ✅ FONCTIONNEL — Utilise RPCs (`get_platform_totals`, `get_org_category_breakdown`, `get_org_country_breakdown`, `get_transaction_stats`). Affiche GMV, take rate, croissance MoM, catégories, pays. 237 lignes. **Vérifier que les RPCs retournent des données correctes.** | 🟡 Potentiellement données approximatives |
| 16 | **SuperadminRiskAML** | ✅ FONCTIONNEL — Fraud flags (table `fraud_flags`), freeze/unfreeze orgs, tickets support intégrés. 248 lignes. | 🟢 |
| 17 | **SuperadminSettlements** | ✅ FONCTIONNEL — Stats held/released/frozen/disputed, orgs sans sous-compte, migration de sous-comptes. 201 lignes. Utilise `release-settlement` et `migrate-subaccounts` edge functions. | 🟢 |
| 18 | **SuperadminAIChat** | ✅ FONCTIONNEL TECHNIQUEMENT — Streaming SSE vers `superadmin-ai-chat` edge function. **Dépend d'une clé API Gemini/OpenAI configurée dans les secrets.** Si le secret n'existe pas, ça crash silencieusement. | 🟡 À vérifier |
| 19 | **SuperadminPush** | ✅ FONCTIONNEL — Insère des notifications pour tous les users avec push subscriptions, le trigger DB `notify_on_notification_insert` envoie le push via `on-notification-created`. | 🟢 |
| 20 | **SuperadminExports** | ✅ FONCTIONNEL — Export CSV de : organisations, utilisateurs, donations, achats, liens affiliés, KYC. 162 lignes. | 🟢 |
| 21 | **SuperadminDirectory** | ✅ FONCTIONNEL — Candidatures d'annuaire avec approve/reject. Approve = `is_verified = true` sur l'org. 186 lignes. | 🟢 |

### 1.3 Fonctionnalités EXISTANTES MAIS NON EXPOSÉES ou PARTIELLEMENT BRANCHÉES

| # | Fonctionnalité | État réel du code | Action nécessaire |
|---|---------------|------------------|------------------|
| 22 | **Bundles** | ✅ EXISTE — `BundleManager.tsx` composant complet. `AdminProductForm` a le switch `is_bundle`. `ProductDetailPage` affiche les items du bundle. `DiscoverPage` filtre par bundle. **C'est fonctionnel mais l'accès au BundleManager dans l'admin n'est peut-être pas évident.** | 🟢 Vérifier l'accessibilité dans le menu admin |
| 23 | **Upsells/Order Bumps** | ⚠️ PARTIELLEMENT IMPLÉMENTÉ — `ProductPurchaseModal.tsx` query les `order_bump_product_id` et `upsell_product_ids`. **MAIS : l'interface admin pour configurer ces champs est absente de `AdminProductForm`.** Les champs existent en DB mais ne sont jamais remplis. | 🟠 UI admin manquante |
| 24 | **Product Reviews** | ✅ EXISTE ET FONCTIONNE — `useProductReviews.ts` hook complet, `ProductReviews.tsx` composant avec formulaire et affichage. `ProductDetailPage` l'utilise via `useProductRecommendations`. **À vérifier si `ProductReviews` est bien rendu sur la page produit publique.** | 🟡 Vérifier l'intégration |
| 25 | **Abandoned Carts** | ⚠️ TRACKING FONCTIONNE, RELANCE NON — `useAbandonedCart.ts` crée les entrées. `AbandonedCartRecovery.tsx` composant admin pour voir/relancer manuellement. `AdminAnalyticsPage` utilise les données dans le funnel. **MAIS : pas de relance automatique par cron.** La fonction `sendAbandonedCartReminder` dans `notifications.ts` existe mais n'est appelée que manuellement. | 🟠 Automatisation manquante |
| 26 | **Referral Codes** | ✅ UTILISÉS — Les codes sont dans `InviteEarnWidget`, `ReferralWidget`, `ShareableEarningsCard`, `InvitePage`. Le trigger `generate_referral_code` les génère. **Le système de parrainage fonctionne : `/invite/:code` → profil du parrain.** C'est utilisé pour le partage social, pas pour un programme "Invite & Earn" actif. | 🟡 Pas mort mais ambigu |
| 27 | **Gamification/Badges** | ✅ EXISTE — 7 composants : `AmbassadorBadges`, `BadgeShowcase`, `BuyerLoyaltyCard`, `ConfettiCelebration`, `RewardToast`, `UserMilestoneTracker`, `XPProgressBar`. **MAIS : pas de trigger automatique d'attribution de badges en DB.** L'attribution doit être manuelle ou non branchée. | 🟠 Non automatisé |
| 28 | **Preuve sociale simulée** | ✅ CONFIRMÉ FAUX — `FloatingProofToast.tsx` génère des noms aléatoires (`GLOBAL_NAMES`), villes (`GLOBAL_CITIES`), produits (`PRODUCT_TITLES`) avec un seed. **100% de données inventées.** Aucune query vers la DB. | 🔴 Risque de réputation |
| 29 | **Status Page** | ⚠️ STATIQUE — Tous les services sont hardcodés comme `operational`. Aucune vérification réelle d'uptime. | 🟡 Cosmétique |
| 30 | **Témoignages** | ✅ CONFIRMÉ STATIQUE — 9 témoignages hardcodés dans le code. Noms, citations, flags — tout est inventé. | 🟠 Faux social proof |
| 31 | **Changelog** | ⚠️ STATIQUE — Hardcodé dans le composant (versions 2.0 à 2.5). Pas alimenté automatiquement. | 🟡 Manuel |
| 32 | **Help/FAQ** | ✅ FONCTIONNEL — FAQ catégorisée, recherche, CTA vers support. Contenu hardcodé mais pertinent. | 🟢 |
| 33 | **QuickPublish** | ✅ FONCTIONNEL — Wizard en 3 étapes (info → file → publish). Upload fichier + couverture + pricing. 381 lignes. | 🟢 |
| 34 | **QuickStart** | ✅ FONCTIONNEL — Affiche top 3 produits à promouvoir, permet l'auto-enrôlement ambassadeur. 315 lignes. | 🟢 |
| 35 | **Migrer** | ✅ FONCTIONNEL UI — Charge `MigrateWizard` en lazy. **À vérifier le contenu de MigrateWizard pour voir si l'import est réel.** | 🟡 À vérifier |
| 36 | **PaymentSuccess** | ✅ TRÈS COMPLET — 749 lignes. Gère Paystack, Stripe, Moneroo. Affiche détails transaction, téléchargement watermarké, partage post-achat. | 🟢 Mais pas d'upsell intégré |

### 1.4 Webhooks backend NON BRANCHÉS

| # | Événement | Code backend qui devrait envoyer le webhook | Existe ? |
|---|-----------|---------------------------------------------|---------|
| W1 | `sale` (vente de produit) | `process-transaction.ts` ou `paystack-webhook` | ❌ Non |
| W2 | `donation` (nouveau don) | `paystack-webhook` ou `stripe-webhook` | ❌ Non |
| W3 | `member_joined` | Trigger sur `organization_members` | ❌ Non |
| W4 | `payout_requested` | `request-affiliate-payout` ou `process-payout` | ❌ Non |
| W5 | `subscription_started` | N/A (abonnements non connectés) | ❌ Non |

---

## ÉTAPE 2 — PLAN DE CORRECTION (PRIORISÉ ET VÉRIFIÉ)

### 🔴 URGENCE MAXIMALE (Confiance + Revenu)

| # | Correction | Détail technique | Effort |
|---|-----------|-----------------|--------|
| **C1** | **Remplacer FloatingProofToast par données réelles** | Remplacer `generateNotification()` par une query `product_purchases + donations` des dernières 24h. Anonymiser (prénom + ville). Si 0 transactions récentes, masquer le composant. | 2h |
| **C2** | **Remplacer témoignages statiques par collecte réelle** | Option A : Connecter aux `product_reviews` existants. Option B : Ajouter un système de collecte post-achat (email J+3) avec opt-in pour publication. | 3h |
| **C3** | **Limites par plan OrgPlan** | 1) Table `plan_limits` ou config JSON. 2) RPC `check_plan_limit(_org_id, _resource)`. 3) Hook `usePlanLimits`. 4) Modal upgrade. 5) Page `/pricing` avec checkout Stripe. | 8h |
| **C4** | **Automatiser relance paniers abandonnés** | Cron `pg_cron` → edge function `abandoned-cart-reminder` toutes les heures. Max 3 relances : 1h, 24h, 72h. Email via Resend avec lien direct checkout. | 4h |
| **C5** | **Vérifier que les avis produits sont affichés sur la page publique** | Vérifier `ProductDetailPage.tsx` — le composant `ProductReviews` est-il importé et rendu ? Si non, l'ajouter. | 1h |

### 🟠 HAUTE PRIORITÉ (Activation + Revenu)

| # | Correction | Détail technique | Effort |
|---|-----------|-----------------|--------|
| **C6** | **Ajouter UI admin pour configurer upsells/order bumps** | Dans `AdminProductForm.tsx`, ajouter un sélecteur de produits pour `order_bump_product_id` et `upsell_product_ids`. Le modal d'achat (`ProductPurchaseModal`) les utilise déjà. | 3h |
| **C7** | **Upsell sur page PaymentSuccess** | Après un achat réussi, afficher les `upsell_product_ids` du produit acheté. "Les clients ont aussi acheté..." | 3h |
| **C8** | **Email drip onboarding** | Edge function + cron. J+0 bienvenue (existe), J+1 "Crée ton premier produit", J+3 "Deviens ambassadeur", J+7 "Success story". Table `email_drip_events` pour tracking. | 5h |
| **C9** | **Auto-capture contacts CRM** | Trigger SQL : après INSERT sur `product_purchases` ou `donations` avec statut `completed`, INSERT dans `contacts` si pas déjà présent. Tag auto `buyer`/`donor`. | 1h |
| **C10** | **Brancher les webhooks backend** | Dans `process-transaction.ts` (ou les edge functions payment), après une transaction complétée, vérifier si l'org a un `webhook_url` et envoyer le POST avec le payload. | 3h |
| **C11** | **Abonnements : connecter le checkout** | Option A : Stripe Subscriptions (le plus standard). L'acheteur choisit un plan sur la page org publique, paye via Stripe, le webhook crée l'entrée dans `subscriptions`. Option B : Paystack recurring charge. | 6h |

### 🟡 PRIORITÉ MOYENNE (Polissage + Growth)

| # | Correction | Détail technique | Effort |
|---|-----------|-----------------|--------|
| **C12** | **Automatiser attribution de badges** | Triggers SQL sur paliers : 1ère vente, 5 ventes, 10 ventes, 50 ventes ; 1er achat, 5 achats ; 1er lien affilié ; 10 clics ; 1ère commission. INSERT dans une table `user_badges`. | 3h |
| **C13** | **Status page dynamique** | Remplacer le hardcode par un ping réel vers : Supabase API, Paystack status, Stripe status. Ou simplement utiliser les données de `platform_metrics_daily` pour détecter des anomalies. | 2h |
| **C14** | **Changelog dynamique** | Soit alimenté manuellement via une table `changelog_entries` + CRUD admin, soit automatisé via les releases GitHub. | 2h |
| **C15** | **Supprimer/Simplifier ModeContext** | Grep tous les `useMode()`, remplacer par logique locale. Supprimer `ModeContext.tsx`. | 3h |
| **C16** | **Tour guidé in-app étendu** | Étendre `OnboardingTour` avec étapes contextuelles selon le rôle choisi sur `/welcome`. Persister dans `profiles`. | 4h |
| **C17** | **Snippets sociaux auto à la publication** | Trigger sur `digital_products.is_published = true` → appeler `ai-generate-snippets`. Stocker dans metadata du produit. Afficher dans le kit de partage. | 3h |
| **C18** | **Email "Laissez un avis" J+3 post-achat** | Cron quotidien → SELECT achats complétés il y a 3 jours sans review → email avec lien direct vers le produit. | 2h |

### 🟢 NICE TO HAVE

| # | Correction | Effort |
|---|-----------|--------|
| **C19** | Exposer intégration Canva dans le Studio IA | 3h |
| **C20** | Exposer import YouTube dans le Studio IA | 3h |
| **C21** | Centre de Commande superadmin (`/superadmin/command-center`) | 8h |
| **C22** | Rapport hebdomadaire auto (cron lundi 9h) | 3h |
| **C23** | Activer watermark download dans le flux de téléchargement | 2h |
| **C24** | Rendre le maillage interne des 30 pages persona cohérent | 4h |
| **C25** | Score de santé plateforme dans le superadmin | 4h |

---

## ÉTAPE 3 — AUTOMATISATION DES TÂCHES D'ÉQUIPE

*(Identique au plan v1 — déjà exhaustif. Voir sections 3.1 à 3.2 du plan précédent.)*

Les ajouts après audit :

| # | Automatisation supplémentaire | Mécanisme |
|---|-------------------------------|-----------|
| **A13** | **Envoi réel de webhooks aux orgs** | Dans `process-transaction.ts`, après chaque transaction complétée | 
| **A14** | **Collecte automatique de témoignages** | Email J+7 post-achat : "Votre avis compte ! Partagez votre expérience" |
| **A15** | **Rotation automatique des produits "En vedette"** | Cron hebdo : recalculer `featured_score` basé sur ventes/vues/avis récents |
| **A16** | **Nettoyage sessions/rate_limits expirées** | La fonction `cleanup_rate_limits()` existe mais est-elle appelée par cron ? |
| **A17** | **Release des commissions maturées** | `release_matured_affiliate_sales()` et `release_matured_partner_commissions()` existent — vérifier qu'elles sont appelées par cron |

---

## ÉTAPE 4-7 — PRODUIT AUTO-OPÉRÉ, IMPLÉMENTATIONS, COHÉRENCE, AMÉLIORATION CONTINUE

*(Identiques au plan v1 — vérifiées et confirmées après audit. Aucun changement nécessaire.)*

---

## NOUVEAUX ÉLÉMENTS DÉCOUVERTS DANS L'AUDIT

### Éléments POSITIFS non identifiés avant

1. **`BundleManager.tsx`** existe et fonctionne — les bundles ne sont PAS morts, ils sont juste peu visibles dans l'admin
2. **`ProductPurchaseModal`** gère déjà les upsells/order bumps côté affichage — il manque juste l'UI admin pour remplir les champs
3. **`AbandonedCartRecovery.tsx`** composant admin existe avec relance manuelle — il manque juste l'automatisation
4. **Les gamification components** sont riches (7 composants) — il manque juste l'automatisation des triggers
5. **`AdminAnalyticsPage`** est très complet (575 lignes, 6+ graphiques) — pas une page morte
6. **Le système de support** (`SuperadminSupport`) est fonctionnel avec un vrai workflow de tickets

### Points de VIGILANCE

1. **`SuperadminAIChat`** utilise la clé anon pour l'auth (`VITE_SUPABASE_PUBLISHABLE_KEY`) — c'est correct pour un edge function avec `verify_jwt = false` mais la vérification superadmin doit se faire côté edge function
2. **Les témoignages sont inventés** — risque légal potentiel (faux témoignages) dans certaines juridictions
3. **Les `referral_codes` sont utilisés** mais le système "Invite & Earn" est écarté — confusion possible pour les utilisateurs qui voient le code mais ne comprennent pas son usage
4. **`AdminSubscriptions`** promet "revenus récurrents" mais ne peut pas réellement facturer — les créateurs pourraient être déçus

---

## RÉSUMÉ FINAL — STATUT RÉEL DU PRODUIT

| Catégorie | Nombre | Fonctionnel | Partiellement | Mort/Faux |
|-----------|--------|-------------|---------------|-----------|
| Pages Admin | 25+ | **20** | **4** (Subscriptions, Webhooks, Experiments, Waitlists) | **1** (Subscriptions sans checkout) |
| Pages Superadmin | 20+ | **18** | **2** (AI Chat dépend secrets, Investor approx.) | **0** |
| Edge Functions | 65+ | ~55 | ~5 | ~5 (à auditer) |
| Fonctionnalités core | 20 | **16** | **4** (Bundles peu visibles, Upsells pas configurables, Carts pas auto, Badges pas auto) | **0** |
| Preuve sociale | 3 | **0** | **1** (GlobalActivityBar) | **2** (FloatingProofToast, Témoignages) |

**Le produit est globalement fonctionnel à ~80%.** Les 20% manquants sont principalement :
- Des automatisations non branchées (paniers, badges, webhooks, drip emails)
- Des configurations impossibles côté admin (upsells, limites par plan)
- De la fausse preuve sociale à remplacer

---

**Ce plan est maintenant exhaustif à 200%. Dis-moi par quoi tu veux commencer.**"