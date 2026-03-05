# SiteViral — Product Requirements Document (PRD)
## Version 3.0 — Mars 2026

---

# TABLE DES MATIÈRES

1. [Vision & Positionnement](#1-vision--positionnement)
2. [Personas & Rôles](#2-personas--rôles)
3. [Architecture Technique](#3-architecture-technique)
4. [Modules Fonctionnels](#4-modules-fonctionnels)
5. [Flux de Paiement](#5-flux-de-paiement)
6. [Programme Ambassadeur](#6-programme-ambassadeur)
7. [Programme Partenaire B2B](#7-programme-partenaire-b2b)
8. [Système KYC & Conformité](#8-système-kyc--conformité)
9. [Système de Notifications](#9-système-de-notifications)
10. [SEO & Partage Social](#10-seo--partage-social)
11. [Sécurité & Anti-Fraude](#11-sécurité--anti-fraude)
12. [Administration Plateforme](#12-administration-plateforme)
13. [Modèle de Données](#13-modèle-de-données)
14. [Edge Functions (Backend)](#14-edge-functions-backend)
15. [Règles Métier Critiques](#15-règles-métier-critiques)
16. [Métriques & Analytics](#16-métriques--analytics)
17. [Infrastructure & Déploiement](#17-infrastructure--déploiement)
18. [Roadmap & Évolutions](#18-roadmap--évolutions)

---

# 1. VISION & POSITIONNEMENT

## 1.1 Mission
SiteViral est une plateforme SaaS multi-tenant permettant à des organisations (églises, ministères, ONG, leaders, communautés) de créer leur présence digitale complète : page publique, vente de produits numériques, collecte de dons, diffusion de médias, gestion de communauté — le tout avec un système de monétisation intégré.

## 1.2 Proposition de valeur
- **Pour les créateurs/organisations** : Un écosystème tout-en-un (site web + boutique + dons + médias + CRM) sans compétences techniques requises
- **Pour les acheteurs/donateurs** : Une marketplace neutre avec paiement sécurisé (Mobile Money + Carte bancaire internationale)
- **Pour les ambassadeurs** : Un programme d'affiliation transparent avec commissions automatisées
- **Pour les partenaires B2B** : Un programme de recrutement d'organisations avec commissions récurrentes

## 1.3 Modèle économique
- **Commission plateforme** : 10% sur chaque transaction (configurable par org)
- **Commission ambassadeur** : 10% par défaut (configurable par org, 0-50%)
- **Répartition type** : 80% organisation / 10% plateforme / 10% ambassadeur
- **Sans ambassadeur** : 90% organisation / 10% plateforme
- **Modèle "Collect First, KYC Later"** : les orgs vendent immédiatement, le KYC n'est requis qu'au moment du retrait

## 1.4 Entité juridique
- **Société** : Hacktualiz Inc.
- **Juridiction** : Delaware, USA
- **Rôle légal** : Merchant of Record (collecte centralisée)
- **Conformité** : AML/AUP, conservation des registres financiers/KYC pendant 5 ans

---

# 2. PERSONAS & RÔLES

## 2.1 Philosophie de séparation des rôles
Principe d'**étanchéité psychologique** : chaque persona voit une interface adaptée à ses besoins. L'acheteur perçoit une marketplace neutre, l'ambassadeur est stimulé par les gains, le créateur dispose d'outils business.

## 2.2 Rôles utilisateur plateforme

| Rôle | Stockage | Description |
|------|----------|-------------|
| `user` | `user_platform_roles` | Utilisateur standard (acheteur/donateur) |
| `superadmin` | `user_platform_roles` | Administrateur de toute la plateforme |

> ⚠️ Les rôles plateforme sont stockés dans `user_platform_roles` (table séparée), JAMAIS dans `profiles` ou `auth.users`. Vérification via fonction SQL `is_superadmin()` avec SECURITY DEFINER.

## 2.3 Rôles au sein d'une organisation

| Rôle | Permissions |
|------|------------|
| `owner` | Contrôle total, suppression org, transfert de propriété |
| `admin` | Gestion complète sauf suppression org |
| `editor` | Création/édition de contenu, pas de gestion financière |
| `member` | Accès lecture, participation communauté |
| `affiliate` | Rôle hérité (non attribué directement), lié aux affiliate_links |

> Stockés dans `organization_members`. Fonctions SQL de vérification : `can_manage_org()` (owner/admin/editor), `can_admin_org()` (owner/admin), `is_org_member()`, `get_org_role()`.

## 2.4 Smart Dashboard Router
Le dashboard (`/dashboard`) détecte automatiquement le profil :
1. **Créateur** (a des orgs gérables) → redirige vers `/admin`
2. **Ambassadeur** (a des liens d'affiliation) → `AmbassadorDashboard`
3. **Acheteur simple** → `UserDashboard` (achats, découvertes, formations)

---

# 3. ARCHITECTURE TECHNIQUE

## 3.1 Stack Frontend
| Technologie | Usage |
|-------------|-------|
| React 18 | Framework UI |
| TypeScript | Typage statique |
| Vite | Bundler + HMR |
| Tailwind CSS | Styling utilitaire |
| shadcn/ui | Composants UI (Radix primitives) |
| Framer Motion | Animations |
| TanStack Query | Cache serveur + synchronisation |
| React Router v6 | Routing SPA |
| React Hook Form + Zod | Formulaires + validation |
| Tiptap | Éditeur de texte riche |
| Recharts | Graphiques dashboard |

## 3.2 Stack Backend
| Technologie | Usage |
|-------------|-------|
| Supabase (PostgreSQL) | Base de données + Auth + Storage |
| Supabase Edge Functions (Deno) | Logique serveur (paiements, emails, webhooks) |
| Supabase Realtime | Notifications temps réel |
| Supabase Storage | Fichiers (images, PDFs, produits) |
| Row Level Security (RLS) | Sécurité au niveau des lignes |

## 3.3 Services externes
| Service | Usage |
|---------|-------|
| Paystack | Paiements Mobile Money (Afrique) |
| Stripe | Paiements carte bancaire (international) |
| Resend | Emails transactionnels |
| OneSignal | Notifications push (Web + Mobile) |
| Cloudflare Workers | SEO pré-rendu (bots sociaux) |
| Google Gemini | IA génération de contenu |

## 3.4 Architecture SEO (3 couches)

```
Bot social (Facebook/Twitter/WhatsApp)
  → Cloudflare Worker (intercept UA bots)
    → Edge Function share-meta (génère HTML meta tags)
      → Retourne OG tags dynamiques

Navigateur humain
  → SPA React
    → Composant SEOHead (meta tags client-side)
```

- **Couche 1** : Cloudflare Worker intercepte les user-agents des bots sociaux et redirige vers l'Edge Function `share-meta`
- **Couche 2** : Edge Function `share-meta` génère du HTML statique avec les balises OG/Twitter appropriées
- **Couche 3** : Composant React `SEOHead` pour le rendu client-side (utilisateurs humains)

## 3.5 Structure des routes (~120 routes)

### Routes publiques
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/org/:slug` | Page publique d'une organisation |
| `/org/:slug/product/:productSlug` | Page produit (sales page) |
| `/org/:slug/donate/:campaignId` | Page de don |
| `/org/:slug/offering/:offeringId` | Page d'offrande |
| `/watch/:id` | Lecteur vidéo |
| `/event/:id` | Détail événement |
| `/program/:id` | Programme de formation |
| `/explore` | Exploration/marketplace |
| `/payment/success` | Confirmation paiement |
| `/devenir-partenaire` | Inscription partenaire B2B |
| `/s/:code` | Liens courts (short links) |

### Routes authentifiées
| Route | Description |
|-------|-------------|
| `/dashboard` | Smart router (créateur/ambassadeur/acheteur) |
| `/my-purchases` | Mes achats |
| `/my-programs` | Mes formations |
| `/settings` | Paramètres profil |
| `/notifications` | Centre de notifications |

### Routes admin (organisation)
| Préfixe | Modules |
|---------|---------|
| `/admin` | Dashboard, Analytics |
| `/admin/products/*` | CRUD produits numériques |
| `/admin/campaigns/*` | CRUD campagnes de dons |
| `/admin/offerings/*` | CRUD offrandes |
| `/admin/media/*` | CRUD médias (vidéo, audio, reels) |
| `/admin/events/*` | CRUD événements |
| `/admin/announcements/*` | CRUD annonces |
| `/admin/programs/*` | CRUD programmes de formation |
| `/admin/photos/*` | Galerie photos |
| `/admin/members` | Gestion membres |
| `/admin/contacts` | CRM / Contacts |
| `/admin/email-campaigns/*` | Campagnes email |
| `/admin/affiliates` | Gestion ambassadeurs |
| `/admin/finances` | Transactions, payouts |
| `/admin/kyc` | Vérification d'identité |
| `/admin/settings` | Paramètres org |
| `/admin/page-settings` | Personnalisation page publique |

### Routes superadmin
| Route | Description |
|-------|-------------|
| `/superadmin` | Dashboard global plateforme |
| `/superadmin/organizations` | Toutes les organisations |
| `/superadmin/users` | Tous les utilisateurs |
| `/superadmin/transactions` | Toutes les transactions |
| `/superadmin/kyc` | Revue KYC |
| `/superadmin/payouts` | Gestion des versements |
| `/superadmin/partners` | Gestion partenaires B2B |
| `/superadmin/reports` | Signalements de contenu |
| `/superadmin/audit-logs` | Journal d'audit |
| `/superadmin/experiments` | A/B testing |
| `/superadmin/ai` | Assistant IA superadmin |

---

# 4. MODULES FONCTIONNELS

## 4.1 Page publique d'organisation (`/org/:slug`)

### Sections configurables (ordre personnalisable via drag & drop)
| Section | Description |
|---------|-------------|
| Hero Banner | Image bannière + logo + nom + description |
| Produits | Grille de produits numériques |
| Dons/Campagnes | Campagnes de collecte avec barre de progression |
| Offrandes | Dons rapides avec montants préétablis |
| Médias | Vidéos, audios, reels |
| Événements | Événements à venir |
| Annonces | Actualités de l'organisation |
| Photos | Galerie photo |
| Programmes | Formations en ligne |

### Personnalisation
- Couleur primaire et accent (via `org_page_settings`)
- Ordre des sections (drag & drop)
- Sections masquables
- Popup configurable (promo, annonce)
- Tracking pixels (Facebook, Google, TikTok)

## 4.2 Produits numériques

### Types supportés
- PDF / eBooks
- Fichiers téléchargeables (ZIP, images, etc.)
- Liens externes (cours Teachable, Gumroad, etc.)
- Bundles (regroupement de produits)

### Fonctionnalités sales page
- Page de vente dédiée (`/org/:slug/product/:productSlug`)
- Image de couverture + galerie de prévisualisation
- Prix barré / prix promo avec compte à rebours (`sale_price`, `sale_ends_at`)
- Description riche (Tiptap editor : texte, images, vidéos, tableaux)
- FAQ intégrée (JSON `faq_json`)
- Témoignages (JSON `testimonials_json`)
- Garantie personnalisable (`guarantee_text`)
- Order bump (produit additionnel en checkout)
- Upsell post-achat (`upsell_product_ids`)
- Recherche full-text (colonne `fts_vector` tsvector)

### Livraison
- Téléchargement sécurisé via URL signée (`generate-signed-url`)
- Filigrane PDF automatique (`watermark-download`)
- Logs de téléchargement (`download_logs`)
- Accès via `/my-purchases`

### Produits gratuits
- Flag `is_free` → acquisition via Edge Function `claim-free-product` (pas de paiement)
- Crée un `product_purchase` avec `status: completed` et `amount: 0`

## 4.3 Campagnes de dons

### Structure
- Titre, description, image
- Objectif financier (`goal_amount`) avec barre de progression
- Montant collecté (`current_amount`) incrémenté atomiquement via `increment_campaign_amount()`
- Date de fin optionnelle (`end_date`)
- Devise (héritée de l'org ou spécifique)

### Flux de don
1. Visiteur choisit le montant + méthode de paiement
2. Paiement traité (Paystack ou Stripe)
3. Webhook crée l'entrée `donations` avec répartition financière
4. `current_amount` de la campagne est incrémenté
5. Notifications envoyées (donateur + org)

## 4.4 Offrandes (Offerings)

### Différence avec les campagnes
- Les offrandes sont **permanentes** (pas d'objectif, pas de date de fin)
- Montants préétablis configurables (`preset_amounts: [1000, 5000, 10000]`)
- Option de don récurrent (`is_recurring_allowed`)
- Idéal pour les dîmes, offrandes hebdomadaires

### Structure
- Table `offerings` pour la configuration
- Table `offering_transactions` pour les paiements

## 4.5 Médias

### Types
| Type | Description |
|------|-------------|
| `video` | Vidéos longues (prédications, enseignements) |
| `audio` | Podcasts, prédications audio |
| `reel` | Vidéos courtes (vertical, format TikTok) |
| `live_replay` | Replays de lives |

### Fonctionnalités
- Lecteur vidéo/audio intégré
- Contenu premium (payant) vs gratuit (`is_premium`)
- Compteur de vues (atomique via `increment_view_count()`)
- Likes / Saves (tables `media_likes`, `media_saves`)
- Historique de visionnage (`watch_history`)
- Tags, séries, orateur (`speaker`)
- Recherche full-text (`fts_vector`)
- Import YouTube (`youtube-channel-import`)

## 4.6 Programmes de formation

### Structure hiérarchique
```
Programme (programs)
  └── Module (program_modules)
       └── Leçon (program_lessons)
```

### Fonctionnalités
- Inscription (`program_enrollments`)
- Suivi de progression par leçon (`lesson_progress`)
- Contenu riche par leçon (texte, vidéo, fichiers)
- Programmes gratuits ou payants (liés à un produit)
- Ordre d'affichage personnalisable

## 4.7 Événements
- Titre, description, image, vidéo
- Date et lieu
- Affichage chronologique
- Événements mis en avant (`is_featured`)

## 4.8 Annonces
- Titre, corps (HTML riche)
- Image avec position configurable
- Épinglage (`is_pinned`)
- Date d'expiration (`expires_at`)
- Publication programmée (`published_at`)

## 4.9 Galerie photos
- Upload multiple avec compression WebP automatique
- Légendes (`caption`)
- Ordre d'affichage (`display_order`)

## 4.10 CRM / Contacts
- Table `contacts` : email, nom, téléphone, tags, source
- Auto-enrichissement : les acheteurs/donateurs sont ajoutés automatiquement
- Tags personnalisables pour segmentation
- Statut d'abonnement (`is_subscribed`)

## 4.11 Campagnes email
- Éditeur HTML riche
- Ciblage par tags de contacts (`recipient_tags`)
- Envoi via Resend (`send-campaign`)
- Métriques : envoyés, ouverts, cliqués
- Statuts : `draft`, `scheduled`, `sending`, `sent`

## 4.12 Éditeur de texte riche (Tiptap)

### Extensions configurées
- StarterKit (paragraphes, listes, citations, code)
- Images (upload + compression WebP)
- Liens (avec ouverture en nouvel onglet)
- Tableaux (avec bordures visibles, cellules sélectionnables)
- Vidéos embarquées (YouTube, Vimeo, TikTok, Dailymotion)
- Vidéos Facebook → lien cliquable (restriction CSP de Facebook)
- Code blocks avec coloration syntaxique (lowlight)
- Alignement texte
- Couleurs de texte
- Soulignement
- Placeholder

---

# 5. FLUX DE PAIEMENT

## 5.1 Politique de routage

```
Mobile Money → Paystack
Apple Pay → Paystack
Carte bancaire → Stripe
```

### Hook unifié : `usePaymentGateway`
- Détecte la méthode de paiement choisie
- Route vers le bon processeur
- Gère les callbacks de succès/échec

## 5.2 Devises supportées

### Paystack (Mobile Money)
`NGN`, `GHS`, `ZAR`, `KES`, `XOF`, `EGP`, `RWF`, `XAF`

### Stripe (Carte)
Toutes les devises supportées par Stripe (135+)

## 5.3 Flux Paystack (Mobile Money)

```
1. Client → usePaystack.openPayment()
2. Popup Paystack (iframe, z-index forcé)
3. Client paie via Mobile Money
4. Paystack → Webhook POST /paystack-webhook
5. Vérification signature HMAC SHA-512
6. Vérification idempotence (payment_events)
7. process-transaction.ts → calcul répartition
8. Insertion en base (donations / product_purchases)
9. Envoi email confirmation (Resend)
10. Callback onSuccess(reference, 'paystack')
```

## 5.4 Flux Stripe (Carte bancaire)

```
1. Client → callFn('stripe-create-checkout', params)
2. Edge Function crée Checkout Session via API Stripe
3. Redirect vers Stripe Checkout (hosted page)
4. Client paie
5. Stripe → Webhook POST /stripe-webhook
6. Vérification signature HMAC SHA-256
7. Vérification idempotence (payment_events)
8. process-transaction.ts → calcul répartition
9. Insertion en base
10. Redirect vers /payment/success?reference=...&gateway=stripe
```

## 5.5 Module de traitement centralisé (`process-transaction.ts`)

Point d'entrée unique pour TOUS les processeurs de paiement.

### Responsabilités
1. **Résolution de l'affiliation** : trouve le `affiliate_link` via le code
2. **Calcul des frais plateforme** : `amount × org.platform_fee_percent / 100`
3. **Calcul commission ambassadeur** : `amount × org.affiliation_commission_percent / 100`
4. **Calcul montant organisation** : `amount - platform_fee - affiliate_commission`
5. **Application promo code** : vérifie validité, incrémente usage (`increment_promo_uses`)
6. **Insertion transaction** : `donations` ou `product_purchases`
7. **Création vente affiliée** : `affiliate_sales` avec statut `pending` et `payable_at = now() + 15 jours`
8. **Mise à jour compteurs** : `increment_sales_count`, `increment_campaign_amount`
9. **Création contact** : auto-ajout dans le CRM de l'org
10. **Envoi notifications** : email acheteur + notification in-app org
11. **Commission partenaire** : si l'org a un partenaire référent actif

### Anti-double traitement
- Table `payment_events` avec contrainte d'unicité sur `(gateway, event_id)`
- Chaque webhook vérifie l'existence avant traitement

## 5.6 Gestion des devises zero-decimal
Les devises sans décimales (XOF, XAF, JPY, etc.) sont gérées spécifiquement :
- Paystack : montant en unité de base (ex: 5000 XOF = 5000)
- Stripe : conversion automatique (`zeroDecimalCurrencies` check)

## 5.7 Références de transaction
Format : `SV-{GATEWAY}-{TIMESTAMP}-{RANDOM}`
- Ex Paystack : `SV-1709123456789-A1B2C3D4E`
- Ex Stripe : `SV-STRIPE-1709123456789-F5G6H7I8J`

---

# 6. PROGRAMME AMBASSADEUR

## 6.1 Concept
Système d'affiliation multi-tenant à 1 niveau. Chaque organisation peut activer l'affiliation et définir le taux de commission.

## 6.2 Inscription ambassadeur
1. Visiteur arrive sur la page d'une org
2. Clique sur "Devenir ambassadeur"
3. Fonction SQL `self_enroll_affiliate()` :
   - Vérifie que l'org a l'affiliation activée
   - Bloque l'auto-affiliation du propriétaire
   - Ajoute comme `member` dans `organization_members`
   - Crée un `affiliate_link` avec code unique
4. Format du code : `{ORG_SLUG_6_CHARS}-{USER_ID_6_CHARS}`

## 6.3 Attribution
- Lien de partage : `siteviral.com/org/slug?ref=CODE` ou `siteviral.com/org/slug/product/xxx?ref=CODE`
- Le code est stocké côté client (cookie/session)
- Table `affiliate_attributions` pour le tracking avancé (cookie_id, landing_url, expiration)
- À la transaction, le `affiliate_code` est transmis au processeur

## 6.4 Commission et paiement
- Commission calculée par `process-transaction.ts`
- Enregistrée dans `affiliate_sales` avec statut `pending`
- **Délai de rétention** : 15 jours (`payable_at = now() + 15 days`)
- Fonction SQL `release_matured_affiliate_sales()` passe en `payable`
- L'ambassadeur peut demander un payout via `request-affiliate-payout`
- Payout traité via `process-payout` (transfert Paystack)

## 6.5 Protection anti-fraude
- Gel de lien (`is_frozen`, `freeze_reason`) en cas de suspicion
- Vérification des flags de fraude (`fraud_flags`)
- Hash de device + IP pour détecter les auto-achats

## 6.6 Dashboard ambassadeur
- Liens actifs par organisation
- Statistiques : clics, conversions, gains
- Historique des commissions
- Demandes de payout

---

# 7. PROGRAMME PARTENAIRE B2B

## 7.1 Concept
Les partenaires recrutent des **organisations** (pas des acheteurs). Ils gagnent une commission récurrente sur TOUTES les transactions des orgs qu'ils ont recrutées.

## 7.2 Niveaux de progression

| Niveau | Nom | Orgs actives requises | Taux |
|--------|-----|----------------------|------|
| 1 | Bronze | 10 | 5% |
| 2 | Silver | 50 | 8% |
| 3 | Gold | 150 | 10% |
| 4 | Platinum | 300 | 12% |
| 5 | Diamond | 1000 | 15% |

> Le taux peut être overridé par le superadmin (`custom_rate_override`).

## 7.3 Flux d'inscription

```
1. Visiteur → /devenir-partenaire
2. Formulaire détaillé :
   - Identité (nom, email, téléphone, pays)
   - Réseau (taille audience, types d'organisations ciblées)
   - Motivation (texte libre)
3. Soumission → insert dans table `partners` (status: pending)
4. Persistance guest-to-login via sessionStorage
5. Si non authentifié → stocke en session, invite à créer un compte
6. Post-login → récupère les données session et soumet
7. Superadmin approuve/rejette via `manage_partner()`
```

## 7.4 Attribution d'organisation
- Lien partenaire : `?partner=CODE`
- Fonction SQL `attribute_org_to_partner()` :
  - Vérifie le code et le statut du partenaire
  - Anti self-referral (le partenaire ne peut pas recruter sa propre org)
  - Anti double attribution (une org ne peut être attribuée qu'une fois)
  - Crée un `partner_referral` avec statut `pending`
  - Passe en `active` au premier paiement reçu par l'org

## 7.5 Commission partenaire
- Calculée dans `process-transaction.ts` via `get_partner_rate()`
- Stockée dans `partner_commissions` avec statut `held`
- Délai de rétention : 15 jours
- Fonction `release_matured_partner_commissions()` passe en `payable`
- Payout via `request-partner-payout` + `process-partner-payout`

## 7.6 KYC partenaire
- Soumission via `submit_partner_kyc()` (ID + selfie)
- Revue par superadmin via `review_partner_kyc()`
- Requis avant le premier payout

---

# 8. SYSTÈME KYC & CONFORMITÉ

## 8.1 Modèle "Collect First, KYC Later"
- Les organisations peuvent vendre et collecter immédiatement
- Les fonds sont retenus sur le compte plateforme
- Le KYC n'est exigé qu'au moment du retrait (payout)

## 8.2 Niveaux KYC organisation

| Niveau | Documents requis | Limite retrait |
|--------|-----------------|----------------|
| `none` | Aucun | Pas de retrait |
| `pending` | Soumis, en attente de revue | Pas de retrait |
| `level1` | Pièce d'identité + Selfie | 1 000 000 XOF/mois |
| `level2` | Level 1 + Document d'organisation | Illimité |
| `rejected` | Rejeté avec motif | Pas de retrait |

## 8.3 Documents par type d'organisation

| Type | Document Level 2 |
|------|-----------------|
| Église | Documents d'enregistrement ecclésiastique |
| ONG | Statuts + récépissé |
| Leader | Certificat de résidence |
| Communauté | Tout document officiel pertinent |

## 8.4 Contraintes de capture
- **Pièce d'identité** : capture directe par caméra uniquement (pas de sélection de fichier)
- **Selfie** : capture caméra obligatoire
- **Documents d'org** : upload de fichier autorisé
- **Liens URL externes** : strictement interdits

## 8.5 Flux de soumission
1. Org owner/admin → `/admin/kyc`
2. Appel `submit_org_kyc()` (function SQL)
3. Statut org passe à `pending`
4. Entrée dans `kyc_submissions` (upsert)
5. Superadmin revoit via `/superadmin/kyc`
6. Appel `review_org_kyc('approve'|'reject')`
7. Si approuvé : déclenchement création sous-compte Paystack (`create-paystack-subaccount`)

## 8.6 Versements (Payouts)

### Délais de rétention
| Bénéficiaire | Délai |
|--------------|-------|
| Organisation (vendeur) | 3 jours |
| Ambassadeur | 15 jours |
| Partenaire B2B | 15 jours |

### Flux payout organisation
1. Org demande un payout (`payout_requests`)
2. Vérification : KYC approuvé + solde suffisant + transfer recipient code
3. Edge Function `process-payout` exécute le transfert Paystack
4. Mise à jour statut `settlement_status` sur les transactions concernées

### Transfer recipients
- Création via `create-transfer-recipient` (Paystack)
- Création partenaire via `create-transfer-recipient-partner`
- Code stocké dans `kyc_submissions.paystack_recipient_code` ou `partners` selon le cas

---

# 9. SYSTÈME DE NOTIFICATIONS

## 9.1 Canaux

| Canal | Technologie | Trigger |
|-------|-------------|---------|
| In-app | Table `user_notifications` + Supabase Realtime | Insert en base |
| Push web | OneSignal via `send-push` | Trigger SQL `notify_on_notification_insert` |
| Email | Resend via `send-email` | Edge Functions |

## 9.2 Notifications automatiques (trigger SQL)
Le trigger `notify_org_members_on_publish()` notifie tous les membres d'une org quand un contenu est publié :
- Nouveau produit
- Nouveau média
- Nouvel événement
- Nouvelle annonce
- Nouveau programme

## 9.3 Préférences de notification
Table `notification_preferences` par utilisateur :
- Activation/désactivation par catégorie (dons, achats, annonces, événements, etc.)
- Toggle email / push séparés

## 9.4 Emails automatisés (`automated-emails`)
- Email de bienvenue post-inscription
- Rappel de panier abandonné (`abandoned_carts`)
- Confirmation d'achat / de don
- Notification de payout

---

# 10. SEO & PARTAGE SOCIAL

## 10.1 Architecture 3 couches (rappel)
1. **Cloudflare Worker** : intercepte les bots (Facebook, Twitter, WhatsApp, LinkedIn, Telegram, etc.)
2. **Edge Function `share-meta`** : génère les balises OG dynamiquement en fonction de l'URL
3. **Composant `SEOHead`** : meta tags côté client pour les navigateurs

## 10.2 Edge Function `generate-preview`
Génère des images OG dynamiques pour le partage social :
- Titre du contenu
- Image de couverture
- Branding organisation

## 10.3 Edge Function `og-proxy`
Proxy pour les images OG avec headers CORS appropriés.

## 10.4 Edge Function `sitemap`
Génère un sitemap XML dynamique incluant :
- Toutes les organisations actives
- Tous les produits publiés
- Tous les événements
- Toutes les campagnes actives

## 10.5 Liens courts (`short_links`)
- Table `short_links` avec code unique
- Route `/s/:code` → redirection
- Compteur de clics (`increment_short_link_clicks()`)
- Usage : partage social, QR codes, tracking

## 10.6 SEO on-page
- Balise `<title>` unique par page (<60 chars)
- Meta description (<160 chars)
- Un seul `<h1>` par page
- HTML sémantique
- Alt text sur les images
- JSON-LD quand applicable
- Lazy loading des images
- Balises canonical
- Viewport responsive

---

# 11. SÉCURITÉ & ANTI-FRAUDE

## 11.1 Authentification
- Supabase Auth (email/password + OAuth providers)
- JWT tokens pour les Edge Functions
- Refresh token automatique côté client

## 11.2 Row Level Security (RLS)
- Activé sur TOUTES les tables
- Fonctions SECURITY DEFINER pour les vérifications de rôle
- Isolation complète des données entre organisations

## 11.3 Sécurité des paiements
- Vérification de signature webhook (HMAC SHA-512 Paystack, SHA-256 Stripe)
- Idempotence via `payment_events`
- Rate limiting persistant via `rate_limits` + `check_rate_limit()`
- Préfixe `SV-` sur toutes les références

## 11.4 Protection anti-fraude
- Table `fraud_flags` pour signaler les utilisateurs suspects
- Hash de device (`device_hash`) sur les transactions
- IP tracking (`buyer_ip`)
- Gel de liens d'affiliation (`is_frozen`)
- Détection d'auto-achat (ambassadeur achète via son propre lien)

## 11.5 Protection des contenus
- Téléchargement via URL signées temporaires (`generate-signed-url`)
- Filigrane PDF automatique avec info acheteur (`watermark-download`)
- Logs de téléchargement (`download_logs`)
- Bucket `private-products` non-public

## 11.6 Signalement de contenu
- Table `content_reports` (type, raison, statut)
- Statuts : `pending`, `reviewed`, `resolved`, `dismissed`
- Interface superadmin de modération

## 11.7 Journal d'audit
- Table `audit_logs` : action, user_id, resource_type, resource_id, metadata, IP
- Traçabilité complète des actions administratives
- Actions KYC, payouts, gestion partenaires

## 11.8 Protection du propriétaire
- Trigger `prevent_owner_role_change()` : empêche la modification du rôle `owner`
- Seul le owner peut supprimer son organisation (`delete_organization()`)

---

# 12. ADMINISTRATION PLATEFORME (SUPERADMIN)

## 12.1 Dashboard global
Fonction SQL `get_platform_totals()` retourne :
- GMV total (dons + achats)
- Frais plateforme collectés
- Commissions affiliés
- Nombre d'orgs (total, actives, suspendues)
- Nombre d'utilisateurs
- KYC en attente
- Payouts en attente
- Signalements en attente
- Take rate (%)
- Taux de conversion

## 12.2 Fonctions analytiques
- `get_top_orgs_by_revenue()` : top orgs par revenu
- `get_org_category_breakdown()` : répartition par catégorie
- `get_org_country_breakdown()` : répartition par pays
- `get_transaction_stats(_from, _to)` : stats filtrées par période

## 12.3 Gestion des organisations
- Liste avec filtres (statut, catégorie, pays, vérification KYC)
- Suspension/réactivation (`is_suspended`)
- Suppression complète (`delete_organization()` : cascade sur 25+ tables)

## 12.4 Gestion KYC
- File d'attente des soumissions `pending`
- Revue des documents (visualisation directe)
- Approbation/rejet avec motif (`review_org_kyc()`)

## 12.5 Gestion des payouts
- File d'attente des demandes
- Vérification du solde plateforme avant exécution
- Exécution via Paystack Transfer API
- Historique complet

## 12.6 Gestion des partenaires
- Approbation/rejet/suspension (`manage_partner()`)
- Override du taux de commission (`set_partner_rate_override()`)
- Transfert de filleuls (`transfer_partner_referral()`)
- Suppression complète (`delete_partner()`)
- Revue KYC partenaire (`review_partner_kyc()`)

## 12.7 Assistant IA (`superadmin-ai-chat`)
- Powered by Google Gemini
- Accès au contexte de la plateforme
- Aide à la prise de décision

## 12.8 A/B Testing (`experiments`)
- Table `experiments` avec variants JSON
- Pourcentage de trafic configurable
- Activation/désactivation

---

# 13. MODÈLE DE DONNÉES

## 13.1 Tables principales (~40 tables)

### Utilisateurs & Organisations
| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs (display_name, avatar, bio, phone, country) |
| `user_platform_roles` | Rôles plateforme (superadmin/user) |
| `organizations` | Organisations multi-tenant |
| `organization_members` | Membres et rôles par org |
| `org_page_settings` | Personnalisation page publique |
| `org_photos` | Galerie photos |

### Contenu
| Table | Description |
|-------|-------------|
| `digital_products` | Produits numériques |
| `bundle_items` | Items dans les bundles |
| `donation_campaigns` | Campagnes de dons |
| `offerings` | Offrandes permanentes |
| `media_content` | Vidéos, audios, reels |
| `events` | Événements |
| `announcements` | Annonces |
| `programs` | Programmes de formation |
| `program_modules` | Modules de programme |
| `program_lessons` | Leçons de programme |

### Transactions
| Table | Description |
|-------|-------------|
| `donations` | Dons |
| `product_purchases` | Achats de produits |
| `offering_transactions` | Transactions d'offrandes |
| `payment_events` | Idempotence des webhooks |
| `promo_codes` | Codes promotionnels |

### Affiliation & Partenariat
| Table | Description |
|-------|-------------|
| `affiliate_links` | Liens d'affiliation |
| `affiliate_sales` | Ventes attribuées |
| `affiliate_attributions` | Tracking d'attribution |
| `partners` | Partenaires B2B |
| `partner_referrals` | Orgs recrutées par partenaires |
| `partner_commissions` | Commissions partenaires |
| `partner_payout_requests` | Demandes payout partenaires |

### KYC & Finance
| Table | Description |
|-------|-------------|
| `kyc_submissions` | Soumissions KYC (une par org) |
| `payout_requests` | Demandes de versement |
| `payout_profiles` | Coordonnées bancaires isolées |

### Communication
| Table | Description |
|-------|-------------|
| `contacts` | CRM contacts |
| `email_campaigns` | Campagnes email |
| `email_logs` | Logs d'envoi email |
| `user_notifications` | Notifications in-app |
| `push_subscriptions` | Abonnements push |
| `notification_preferences` | Préférences par utilisateur |

### Engagement
| Table | Description |
|-------|-------------|
| `media_likes` | Likes sur les médias |
| `media_saves` | Sauvegardes de médias |
| `watch_history` | Historique de visionnage |
| `lesson_progress` | Progression des leçons |
| `program_enrollments` | Inscriptions aux programmes |
| `content_comments` | Commentaires (threaded) |
| `content_versions` | Versioning de contenu |
| `badges` | Badges de gamification |

### Sécurité & Audit
| Table | Description |
|-------|-------------|
| `fraud_flags` | Signaux de fraude |
| `content_reports` | Signalements de contenu |
| `audit_logs` | Journal d'audit |
| `rate_limits` | Rate limiting persistant |
| `download_logs` | Logs de téléchargement |
| `abandoned_carts` | Paniers abandonnés |
| `client_events` | Événements analytics client |

### Divers
| Table | Description |
|-------|-------------|
| `short_links` | Liens courts |
| `directory_applications` | Demandes d'annuaire |
| `experiments` | A/B testing |
| `org_daily_metrics` | Métriques quotidiennes agrégées |

## 13.2 Fonctions SQL critiques

| Fonction | Type | Description |
|----------|------|-------------|
| `is_superadmin(uuid)` | SECURITY DEFINER | Vérifie le rôle superadmin |
| `can_manage_org(uuid, uuid)` | SECURITY DEFINER | Vérifie owner/admin/editor |
| `can_admin_org(uuid, uuid)` | SECURITY DEFINER | Vérifie owner/admin |
| `create_organization_with_owner()` | SECURITY DEFINER | Crée org + membre owner atomiquement |
| `delete_organization(uuid)` | SECURITY DEFINER | Suppression cascade complète |
| `delete_user_account(uuid)` | SECURITY DEFINER | Suppression compte + données |
| `self_enroll_affiliate(uuid)` | SECURITY DEFINER | Auto-inscription ambassadeur |
| `submit_org_kyc(...)` | SECURITY DEFINER | Soumission KYC |
| `review_org_kyc(uuid, text)` | SECURITY DEFINER | Revue KYC par superadmin |
| `manage_partner(uuid, text)` | SECURITY DEFINER | Gestion partenaire |
| `check_rate_limit(text, int, int)` | SECURITY DEFINER | Rate limiting |
| `increment_sales_count(uuid)` | SECURITY DEFINER | Compteur ventes atomique |
| `increment_campaign_amount(uuid, numeric)` | SECURITY DEFINER | Compteur campagne atomique |
| `increment_promo_uses(uuid)` | SECURITY DEFINER | Compteur promo avec verrou |
| `get_platform_totals()` | SECURITY DEFINER | Statistiques globales |
| `compute_partner_level(uuid)` | SECURITY DEFINER | Calcul niveau partenaire |
| `get_partner_rate(uuid)` | SECURITY DEFINER | Taux commission partenaire |
| `attribute_org_to_partner(uuid, text)` | SECURITY DEFINER | Attribution org→partenaire |
| `prevent_owner_role_change()` | TRIGGER | Protection rôle owner |
| `validate_product_publish()` | TRIGGER | Bloque publication sans fichier |
| `generate_product_slug()` | TRIGGER | Génération slug unique |
| `notify_org_members_on_publish()` | TRIGGER | Notification auto publication |
| `release_matured_affiliate_sales()` | Cron-like | Libère commissions matures |
| `release_matured_partner_commissions()` | Cron-like | Libère commissions partenaires |

---

# 14. EDGE FUNCTIONS (BACKEND)

## 14.1 Inventaire complet (~38 fonctions)

### Paiements
| Fonction | JWT | Description |
|----------|-----|-------------|
| `stripe-create-checkout` | Non | Crée session Stripe Checkout |
| `stripe-webhook` | Non | Reçoit webhooks Stripe |
| `stripe-verify` | Non | Vérifie session Stripe |
| `stripe-connect-onboarding` | Non | Onboarding Stripe Connect |
| `stripe-connect-status` | Non | Statut Stripe Connect |
| `paystack-webhook` | Non | Reçoit webhooks Paystack |
| `verify-payment` | Non | Vérifie paiement Paystack |
| `claim-free-product` | Non | Acquisition produit gratuit |

### Payouts
| Fonction | JWT | Description |
|----------|-----|-------------|
| `request-affiliate-payout` | Non | Demande payout ambassadeur |
| `process-payout` | Non | Exécute transfert Paystack |
| `request-partner-payout` | Non | Demande payout partenaire |
| `process-partner-payout` | Non | Exécute payout partenaire |
| `release-settlement` | Non | Libère fonds en rétention |
| `settle-pre-subaccount` | Non | Settle pré-subaccount |
| `check-payout-capabilities` | Non | Vérifie capacités de payout |
| `create-transfer-recipient` | Non | Crée recipient Paystack (org) |
| `create-transfer-recipient-partner` | Non | Crée recipient Paystack (partenaire) |
| `create-paystack-subaccount` | Non | Crée sous-compte Paystack |
| `migrate-subaccounts` | Non | Migration sous-comptes |

### Communication
| Fonction | JWT | Description |
|----------|-----|-------------|
| `send-email` | Non | Envoi email via Resend |
| `send-push` | Non | Notification push via OneSignal |
| `send-campaign` | Non | Envoi campagne email |
| `automated-emails` | Non | Emails automatisés (bienvenue, rappels) |
| `backfill-purchase-emails` | Non | Renvoi emails manquants |
| `on-notification-created` | Non | Handler trigger notification |
| `onesignal-test-push` | Non | Test push OneSignal |

### Contenu & Médias
| Fonction | JWT | Description |
|----------|-----|-------------|
| `generate-signed-url` | Non | URL signée pour téléchargement |
| `watermark-download` | Non | Téléchargement PDF avec filigrane |
| `ai-write-content` | Non | Génération contenu IA (Gemini) |
| `ai-generate-cover` | Non | Génération image de couverture IA |
| `youtube-channel-import` | Non | Import chaîne YouTube |

### SEO & Partage
| Fonction | JWT | Description |
|----------|-----|-------------|
| `share-meta` | Non | Génère balises OG pour bots |
| `generate-preview` | Non | Génère image preview |
| `og-proxy` | Non | Proxy images OG |
| `sitemap` | Non | Génère sitemap XML |

### Analytics & Admin
| Fonction | JWT | Description |
|----------|-----|-------------|
| `aggregate-metrics` | Non | Agrège métriques quotidiennes |
| `superadmin-ai-chat` | Non | Assistant IA superadmin |

> Note : `verify_jwt = false` dans `config.toml` car l'authentification est gérée manuellement dans le code des fonctions pour plus de flexibilité.

---

# 15. RÈGLES MÉTIER CRITIQUES

## 15.1 Répartition financière
```
Pour chaque transaction :
  platform_fee = amount × org.platform_fee_percent / 100
  
  SI affiliate_code valide ET org.affiliation_enabled :
    affiliate_commission = amount × org.affiliation_commission_percent / 100
  SINON :
    affiliate_commission = 0
  
  organization_amount = amount - platform_fee - affiliate_commission
```

## 15.2 Délais de rétention
- **Vendeur** : 3 jours avant payout
- **Ambassadeur** : 15 jours avant libération (`payable_at`)
- **Partenaire** : 15 jours avant libération

## 15.3 Anti self-referral
- Un propriétaire d'org ne peut pas être ambassadeur de sa propre org
- Un partenaire ne peut pas recruter sa propre org
- Vérification dans `self_enroll_affiliate()` et `attribute_org_to_partner()`

## 15.4 Protection du propriétaire
- Le trigger `prevent_owner_role_change()` empêche toute modification du rôle `owner`
- Seul le owner ou un superadmin peut supprimer une org

## 15.5 Validation de publication
- Le trigger `validate_product_publish()` empêche la publication d'un produit sans fichier ni lien externe

## 15.6 Unicité des slugs produits
- Le trigger `generate_product_slug()` génère un slug unique par org à partir du titre

## 15.7 Gestion des promo codes
- Vérification atomique avec `FOR UPDATE` dans `increment_promo_uses()`
- Respect du `max_uses` configuré
- Validation de la date d'expiration

## 15.8 Suppression d'organisation
- Cascade manuelle sur 25+ tables via `delete_organization()`
- Notification de tous les membres
- Retourne un résumé (montants dons, nombre de donateurs, membres notifiés)

## 15.9 Suppression de compte utilisateur
- Cascade via `delete_user_account()`
- Supprime : affiliations, achats, dons, memberships, notifications, médias sociaux, profile, auth.user
- Vérifie que l'appelant est bien le propriétaire du compte

---

# 16. MÉTRIQUES & ANALYTICS

## 16.1 Métriques agrégées (`org_daily_metrics`)
Edge Function `aggregate-metrics` exécutée quotidiennement :
- `revenue` : chiffre d'affaires du jour
- `transactions_count` : nombre de transactions
- `donations_count` : nombre de dons
- `products_sold` : produits vendus
- `new_members` : nouveaux membres
- `page_views` : vues de page
- `affiliate_sales_count` : ventes via affiliation
- `affiliate_commission_total` : commissions affiliation

## 16.2 Événements client (`client_events`)
Tracking côté client :
- `event_name` : nom de l'événement
- `event_data` : données JSON
- `page_url`, `referrer`
- `device_type`
- `session_id`

## 16.3 Dashboard admin analytics
- Graphiques temporels (Recharts)
- Comparaison de périodes
- KPIs : revenu, transactions, membres, vues
- Top produits, top campagnes

## 16.4 Dashboard superadmin
- Fonction `get_platform_totals()` : 30+ métriques globales
- Top orgs par revenu (`get_top_orgs_by_revenue()`)
- Répartition par catégorie (`get_org_category_breakdown()`)
- Répartition par pays (`get_org_country_breakdown()`)
- Stats filtrées par période (`get_transaction_stats()`)

---

# 17. INFRASTRUCTURE & DÉPLOIEMENT

## 17.1 Hébergement
| Composant | Service |
|-----------|---------|
| Frontend | Lovable (CDN) |
| Base de données | Supabase (PostgreSQL) |
| Edge Functions | Supabase (Deno Deploy) |
| Storage | Supabase Storage |
| SEO Worker | Cloudflare Workers |
| Domaine | `graceconnect.lovable.app` (custom domain configurable) |

## 17.2 Storage Buckets

| Bucket | Public | Usage |
|--------|--------|-------|
| `public-assets` | ✅ | Assets généraux |
| `user-avatars` | ✅ | Avatars utilisateurs |
| `org-uploads` | ✅ | Images org (bannières, covers) |
| `product-previews` | ✅ | Prévisualisations produits |
| `private-products` | ❌ | Fichiers produits (accès signé) |
| `kyc-documents` | ❌ | Documents KYC (confidentiel) |

## 17.3 Secrets requis

| Secret | Service | Usage |
|--------|---------|-------|
| `STRIPE_SECRET_KEY` | Stripe | Paiements carte |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Vérification webhook |
| `PAYSTACK_SECRET_KEY` | Paystack | Paiements Mobile Money |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack | Clé publique (client) |
| `VITE_PAYSTACK_MODE` | Paystack | `live` ou `test` |
| `RESEND_API_KEY` | Resend | Emails |
| `ONESIGNAL_REST_API_KEY` | OneSignal | Push notifications |
| `GEMINI_API_KEY` | Google | IA contenu |
| `VAPID_PRIVATE_KEY` | Web Push | Push natif |
| `VITE_VAPID_PUBLIC_KEY` | Web Push | Push natif (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Accès admin DB |
| `SUPABASE_URL` | Supabase | URL du projet |
| `SUPABASE_ANON_KEY` | Supabase | Clé publique |

## 17.4 PWA
- Configuration via `vite-plugin-pwa`
- Manifest + Service Worker
- Installation sur mobile (Add to Home Screen)

---

# 18. ROADMAP & ÉVOLUTIONS POSSIBLES

## 18.1 Court terme
- [ ] Paiements récurrents (abonnements Stripe)
- [ ] Multi-langue (i18n)
- [ ] App mobile native (React Native / Capacitor)
- [ ] Stripe Connect pour payouts internationaux

## 18.2 Moyen terme
- [ ] Marketplace cross-org (découverte de produits entre orgs)
- [ ] Live streaming intégré
- [ ] Certificats de formation (génération PDF)
- [ ] Système de coupons avancé
- [ ] Webhooks sortants pour intégrations tierces

## 18.3 Long terme
- [ ] API publique pour développeurs
- [ ] White-label (domaines personnalisés par org)
- [ ] Paiements en crypto
- [ ] Place de marché de thèmes
- [ ] Intégration comptable (QuickBooks, Wave)

---

# ANNEXE A : HOOKS PERSONNALISÉS (~45)

| Hook | Responsabilité |
|------|---------------|
| `useAuth` | Contexte d'authentification |
| `useOrg` | Contexte organisation courante |
| `usePaymentGateway` | Routage paiement unifié |
| `usePaystack` | Intégration Paystack |
| `useAffiliateTracking` | Capture du code affilié |
| `useGamification` | Badges et progression |
| `useNotifications` | Notifications temps réel |
| `usePushSubscription` | Abonnement push |
| `useMediaPlayer` | Lecteur média |
| `useImageUpload` | Upload + compression WebP |
| `useOrgProducts` | Produits d'une org |
| `useOrgCampaigns` | Campagnes d'une org |
| `useOrgMembers` | Membres d'une org |
| `useOrgMetrics` | Métriques d'une org |
| ... | (et ~30 autres) |

---

# ANNEXE B : COMPOSANTS UI CLÉS

| Composant | Usage |
|-----------|-------|
| `AppLayout` | Layout principal (sidebar + header + outlet) |
| `AdminShell` | Wrapper routes admin (vérifie org) |
| `Sidebar` | Navigation latérale responsive |
| `SEOHead` | Meta tags dynamiques |
| `RichTextEditor` | Éditeur Tiptap complet |
| `PaymentMethodSelector` | Sélection méthode de paiement |
| `DonationForm` | Formulaire de don |
| `ProductCard` | Carte produit |
| `CampaignCard` | Carte campagne |
| `MediaPlayer` | Lecteur vidéo/audio |
| `OnboardingTour` | Tour guidé admin |
| `EmptyState` | État vide réutilisable |
| `DataTable` | Tableau de données paginé |

---

# ANNEXE C : CONVENTIONS DE CODE

## Nommage
- **Fichiers** : PascalCase pour les composants, camelCase pour les hooks/utils
- **Tables SQL** : snake_case
- **Colonnes SQL** : snake_case
- **Fonctions SQL** : snake_case avec préfixe verbal (`is_`, `can_`, `get_`, `increment_`)
- **Edge Functions** : kebab-case (ex: `stripe-create-checkout`)
- **Routes** : kebab-case (ex: `/admin/page-settings`)

## Sécurité SQL
- Toutes les fonctions métier utilisent `SECURITY DEFINER`
- `SET search_path TO 'public'` obligatoire
- Vérification `auth.uid()` en entrée
- Pas de modification des schémas réservés Supabase

## Patterns React
- Contextes : `AuthContext`, `OrgContext`
- État serveur : TanStack Query (pas de Redux)
- Formulaires : React Hook Form + Zod
- UI : shadcn/ui + Tailwind (tokens sémantiques, pas de couleurs hardcodées)
- Animations : Framer Motion

---

*Document généré le 5 mars 2026. Propriété de Hacktualiz Inc.*
