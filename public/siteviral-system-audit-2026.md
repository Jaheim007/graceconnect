# SITEVIRAL — Audit Structurel Complet du Système
### Date : 2 mars 2026
### Version : 1.0

---

## TABLE DES MATIÈRES

1. [Carte complète des pages](#1-carte-complète-des-pages)
2. [Rôles utilisateurs & flux](#2-rôles-utilisateurs--flux)
3. [Structure de navigation](#3-structure-de-navigation)
4. [Architecture de paiement](#4-architecture-de-paiement)
5. [Système Affilié / Ambassadeur](#5-système-affilié--ambassadeur)
6. [Système Créateur](#6-système-créateur)
7. [Structure de la base de données](#7-structure-de-la-base-de-données)
8. [Structure SEO](#8-structure-seo)
9. [Performance & Analyse de risques](#9-performance--analyse-de-risques)
10. [Analyse de simplification](#10-analyse-de-simplification)

---

## 1. CARTE COMPLÈTE DES PAGES

### 1.1 Landing Pages (SEO-indexables)

| Route | Description |
|-------|------------|
| `/` | Page d'accueil principale (LandingPage) |
| `/features` | Fonctionnalités de la plateforme |
| `/pricing` | Tarification (LandingPricing) |
| `/about` | À propos |
| `/contact` | Formulaire de contact |
| `/faq` | Questions fréquentes |
| `/temoignages` | Témoignages clients |
| `/etudes-de-cas` | Études de cas |
| `/presse` | Page presse |
| `/changelog` | Journal des changements |
| `/resources` | Centre de ressources |
| `/status` | Statut de la plateforme |
| `/install` | Installation PWA |
| `/comparer` | Comparateur de plateformes |
| `/calculateur` | Calculateur de revenus |
| `/blog` | Index du blog (~140 articles) |
| `/blog/:slug` | Articles de blog individuels |

### 1.2 Pages Persona (SEO — ~30 pages)

| Route | Cible |
|-------|-------|
| `/pour/influenceurs` | Influenceurs |
| `/pour/formateurs` | Formateurs |
| `/pour/coaches` | Coaches |
| `/pour/eglises` | Églises |
| `/pour/associations` | Associations |
| `/pour/ong` | ONG |
| `/pour/createurs-video` | Créateurs vidéo |
| `/pour/musiciens` | Musiciens |
| `/pour/podcasters` | Podcasters |
| `/pour/bloggeurs` | Bloggeurs |
| `/pour/auteurs` | Auteurs |
| `/pour/photographes` | Photographes |
| `/pour/designers` | Designers |
| `/pour/consultants` | Consultants |
| `/pour/agences` | Agences |
| `/pour/entrepreneurs` | Entrepreneurs |
| `/pour/etudiants` | Étudiants |
| `/pour/retraites` | Retraités |
| `/pour/femmes-entrepreneur` | Femmes entrepreneures |
| `/pour/diaspora` | Diaspora |
| `/pour/enseignants` | Enseignants |
| `/pour/centres-formation` | Centres de formation |
| `/pour/cooperatives` | Coopératives |
| `/pour/medias` | Médias |
| `/pour/juristes` | Juristes |
| `/pour/sante` | Professionnels de santé |
| `/pour/finance` | Finance |
| `/pour/ministeres` | Ministères religieux |
| `/pour/missionnaires` | Missionnaires |
| `/pour/leaders-musulmans` | Leaders musulmans |

### 1.3 Guides SEO (~9 articles longs)

| Route | Sujet |
|-------|-------|
| `/guides/affiliation-sans-investissement` | Affiliation sans investissement |
| `/guides/boutique-digitale` | Créer une boutique digitale |
| `/guides/vendre-ebook` | Vendre un ebook |
| `/guides/vendre-cours` | Vendre des cours en ligne |
| `/guides/mobile-money` | Paiements Mobile Money |
| `/guides/monetiser-contenu-religieux` | Monétiser du contenu religieux |
| `/guides/plateforme-dons` | Plateformes de dons |
| `/guides/alternative-gofundme` | Alternatives à GoFundMe |
| `/guides/gagner-sans-contenu` | Gagner sans créer de contenu |

### 1.4 Pages Légales (SEO-indexables)

| Route | Page |
|-------|------|
| `/terms` | Conditions d'utilisation |
| `/privacy` | Politique de confidentialité |
| `/refund-policy` | Politique de remboursement |
| `/acceptable-use` | Usage acceptable |
| `/compliance` | Conformité |
| `/security` | Sécurité |
| `/aml` | Anti-blanchiment |
| `/dpa` | Protection des données |
| `/subprocessors` | Sous-traitants |
| `/payout-policy` | Politique de paiement |
| `/ambassador-terms` | Conditions ambassadeur |
| `/partner-terms` | Conditions partenaire |

### 1.5 Marketplace / Découverte (SPA, auth optionnel)

| Route | Description |
|-------|------------|
| `/discover` | Page découverte principale |
| `/marketplace` | Marketplace (alias/variante) |
| `/feed` | Fil d'actualité |
| `/watch` | Contenu vidéo |
| `/reels` | Contenu court format |
| `/leaderboard` | Classement |
| `/org/:slug` | Page publique d'organisation |
| `/org/:slug/product/:productId` | Détail produit |
| `/org/:slug/offering/:offeringId` | Détail offrande |
| `/org/:slug/event/:eventId` | Détail événement |
| `/org/:slug/campaign/:campaignId` | Détail campagne |
| `/org/:slug/program/:programId` | Détail programme |
| `/org/:slug/announcement/:id` | Détail annonce |
| `/org/:slug/affiliation` | Page publique d'affiliation |

### 1.6 Pages Auth (SPA)

| Route | Description |
|-------|------------|
| `/auth` | Login / Inscription |
| `/auth/callback` | Callback OAuth |
| `/welcome` | Intent post-inscription |
| `/invite/:code` | Lien d'invitation |

### 1.7 Dashboard Utilisateur (Auth requis, SPA)

| Route | Description |
|-------|------------|
| `/dashboard` | Tableau de bord utilisateur |
| `/profile` | Profil |
| `/bookmarks` | Favoris |
| `/my-programs` | Mes programmes |
| `/my-invoices` | Mes factures |
| `/notifications` | Notifications |
| `/notification-preferences` | Préférences de notification |
| `/analytics` | Statistiques personnelles |
| `/affiliation` | Mon panneau d'affiliation |
| `/ambassador` | Dashboard ambassadeur |

### 1.8 Admin Créateur (Auth + rôle owner/admin, SPA)

| Route | Description |
|-------|------------|
| `/admin` | Dashboard admin principal |
| `/admin/analytics` | Analytiques org |
| `/admin/sales` | Ventes |
| `/admin/products/new` | Nouveau produit |
| `/admin/products/:id/edit` | Modifier produit |
| `/admin/programs` | Programmes |
| `/admin/programs/new` | Nouveau programme |
| `/admin/programs/:id/edit` | Modifier programme |
| `/admin/offerings` | Offrandes |
| `/admin/subscriptions` | Abonnements |
| `/admin/media` | Médias |
| `/admin/media/new` | Nouveau média |
| `/admin/media/:id/edit` | Modifier média |
| `/admin/photos` | Photos |
| `/admin/pages` | Pages (annonces, événements, campagnes) |
| `/admin/announcements/new` | Nouvelle annonce |
| `/admin/announcements/:id/edit` | Modifier annonce |
| `/admin/events/new` | Nouvel événement |
| `/admin/events/:id/edit` | Modifier événement |
| `/admin/campaigns/new` | Nouvelle campagne |
| `/admin/campaigns/:id/edit` | Modifier campagne |
| `/admin/crm` | CRM / contacts |
| `/admin/notifications` | Notifications push/email |
| `/admin/promo-codes` | Codes promo |
| `/admin/payouts` | Demandes de paiement |
| `/admin/waitlists` | Listes d'attente |
| `/admin/webhooks` | Webhooks |
| `/admin/experiments` | Tests A/B |

### 1.9 Superadmin (Auth + superadmin, SPA)

| Route | Description |
|-------|------------|
| `/superadmin` | Dashboard global |
| `/superadmin/users` | Gestion utilisateurs |
| `/superadmin/directory` | Annuaire organisations |
| `/superadmin/partners` | Partenaires |
| `/superadmin/settlements` | Règlements |
| `/superadmin/exports` | Exports |
| `/superadmin/push` | Push notifications |
| `/superadmin/email-logs` | Logs email |
| `/superadmin/support` | Support |
| `/superadmin/activity` | Fil d'activité |
| `/superadmin/risk-aml` | Risque / AML |
| `/superadmin/investor-snapshot` | Vue investisseur |
| `/superadmin/ai-chat` | Chat IA |
| `/superadmin/settings` | Paramètres plateforme |

### 1.10 Pages Spéciales

| Route | Description |
|-------|------------|
| `/go/:code` | Redirection lien court |
| `/payment-success` | Confirmation de paiement |
| `/create-org` | Créer une organisation |
| `/become-partner` | Devenir partenaire |
| `/partner-portal` | Portail partenaire |
| `/help` | Centre d'aide |
| `/support` | Support |
| `/maintenance` | Page de maintenance |
| `*` | Page 404 |

---

## 2. RÔLES UTILISATEURS & FLUX

### 2.1 Visiteur (non authentifié)

```
Entrée : Landing page / SEO / Lien partagé
├── Découvre la plateforme (landing, persona, guides, blog)
├── Browse marketplace / discover
├── Visite une page org publique
├── Consulte un produit
├── Clique sur lien affilié → cookie capturé
└── Conversion : inscription → Auth
```

### 2.2 Membre (authentifié, sans org)

```
Entrée : Post-inscription → /welcome (intent)
├── Choisit intention : acheter, créer, devenir ambassadeur
├── Browse & achète des produits
├── Fait des dons / offrandes
├── Rejoint des programmes
├── S'inscrit en tant qu'affilié pour une org
├── Suit le leaderboard
├── Gère son profil, bookmarks, factures
└── Conversion : crée une org → Créateur
```

### 2.3 Ambassadeur / Affilié

```
Entrée : /affiliation ou lien d'invitation
├── Génère des liens affiliés (par produit ou org)
├── Partage via WhatsApp, réseaux sociaux
├── Suit ses clics, conversions, commissions
├── Badge "Ambassadeur" visible
├── Objectifs de performance (AmbassadorGoalTracker)
├── Demande de paiement des commissions
└── Flux avancé : multi-org, compétition leaderboard
```

### 2.4 Créateur (owner d'organisation)

```
Entrée : /create-org → /admin
├── Configure l'organisation (nom, logo, description)
├── Crée des produits numériques (ebook, cours, etc.)
├── Crée des campagnes de dons
├── Crée des offrandes
├── Crée des événements
├── Crée des programmes (modules, leçons)
├── Active le système d'affiliation
├── Gère les contacts (CRM)
├── Envoie des notifications/campagnes email
├── Soumet KYC pour débloquer les payouts
├── Configure les webhooks
└── Flux monétisation :
    ├── Ventes de produits → commission plateforme → paiement
    ├── Dons → commission plateforme → paiement
    └── Offrandes → commission plateforme → paiement
```

### 2.5 Partenaire (programme partenaire)

```
Entrée : /become-partner → KYC
├── Réfère des organisations
├── Gagne des commissions sur les transactions des orgs référées
├── Suit ses commissions dans le portail partenaire
└── Demande de paiement
```

### 2.6 Superadmin

```
Entrée : /superadmin
├── Vue globale de toutes les organisations
├── Gestion des utilisateurs
├── Gestion des partenaires
├── Suivi des règlements
├── Logs email & activité
├── Gestion risque / AML
├── Vue investisseur (métriques globales)
├── Chat IA d'assistance
└── Configuration plateforme
```

### 2.7 Conflits / Chevauchements identifiés

| Conflit | Détail |
|---------|--------|
| Membre ↔ Ambassadeur | Un membre peut être ambassadeur pour plusieurs orgs tout en étant créateur de sa propre org |
| `/discover` ↔ `/marketplace` | Routes quasi-identiques en fonction, potentielle confusion |
| `/affiliation` ↔ `/ambassador` | Deux entrées pour un concept similaire |
| Admin ↔ Superadmin | Certaines fonctionnalités admin (analytics) sont dupliquées au niveau superadmin |

---

## 3. STRUCTURE DE NAVIGATION

### 3.1 Navigation publique (LandingNav)

```
Logo | Fonctionnalités | Marketplace | Tarifs | Blog | FAQ | Connexion | Commencer
```

### 3.2 Navigation connectée (Sidebar + TopBar + BottomNav)

**Sidebar principale :**
```
├── Accueil (Discover)
├── Feed
├── Watch / Reels
├── Leaderboard
├── Mes programmes
├── Mes factures
├── Bookmarks
├── Affiliation
├── Notifications
├── Profil
└── Admin (si owner) → sous-menu admin
```

**BottomNav (mobile) :**
```
Accueil | Explorer | Créer | Notifications | Profil
```

### 3.3 Navigation Admin

```
├── Dashboard
├── Ventes
├── Produits
├── Programmes
├── Offrandes
├── Médias
├── Photos
├── Pages (Annonces, Événements, Campagnes)
├── CRM
├── Notifications
├── Codes promo
├── Paiements
├── Analytiques
├── Abonnements
├── Listes d'attente
├── Webhooks
├── Expériences A/B
└── Retour au site
```

### 3.4 Items redondants ou confus

| Item | Problème |
|------|----------|
| Watch vs Reels | Fonctions très proches, confusion possible |
| Feed vs Discover | Feed = fil chronologique, Discover = marketplace. La distinction n'est pas évidente pour l'utilisateur |
| Affiliation vs Ambassador | Termes interchangeables dans le code |
| Pages (admin) | Regroupe annonces + événements + campagnes, mais chacun a aussi un formulaire dédié |

---

## 4. ARCHITECTURE DE PAIEMENT

### 4.1 Flux global

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUX DE PAIEMENT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React)                                               │
│  ├── ProductPurchaseModal / DonateModal / OfferingModal         │
│  ├── usePaymentGateway() → détecte le gateway                  │
│  │   ├── Stripe → stripe-create-checkout (edge fn)              │
│  │   └── Paystack → js.paystack.co (inline popup)              │
│  │                                                              │
│  ├── Stripe flow:                                               │
│  │   ├── stripe-create-checkout → crée session Checkout         │
│  │   ├── Redirect → Stripe hosted page                         │
│  │   ├── Webhook: stripe-webhook (edge fn)                      │
│  │   │   └── process-transaction.ts (shared)                   │
│  │   └── Redirect retour → /payment-success                    │
│  │                                                              │
│  ├── Paystack flow:                                             │
│  │   ├── Popup Paystack inline                                  │
│  │   ├── onSuccess → verify-payment (edge fn)                   │
│  │   │   ├── Vérifie avec API Paystack                         │
│  │   │   └── process-transaction.ts (shared)                   │
│  │   ├── Webhook: paystack-webhook (edge fn)                    │
│  │   │   └── process-transaction.ts (idempotent)               │
│  │   └── Frontend: 8 tentatives de vérification                │
│  │                                                              │
│  └── process-transaction.ts (logique partagée) :               │
│      ├── Calcul fees : platform_fee = montant × fee%           │
│      ├── org_amount = montant - platform_fee                   │
│      ├── Si affilié : commission = org_amount × commission%    │
│      ├── Insert dans table correspondante                      │
│      ├── Update campaign/product counters                      │
│      ├── Attribution affilié                                    │
│      ├── Envoi email confirmation                              │
│      ├── Webhook org (si configuré)                            │
│      └── Gamification (XP, badges)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Distribution des commissions

```
Transaction (100%)
├── Platform Fee (configuré par org, défaut ~5%)
├── Organisation Amount (100% - platform fee)
│   └── Si affilié actif :
│       ├── Commission affilié (% configuré par org)
│       └── Reste → organisation
└── Settlement :
    ├── Paystack : via subaccount (split automatique)
    └── Stripe : via Connect (transfer)
```

### 4.3 Protection d'idempotence

```
Table: payment_events
├── payment_reference (unique)
├── event_type
├── Vérifié AVANT chaque process-transaction
└── Si déjà existant → skip (pas de double-comptage)
```

### 4.4 Points de fragilité identifiés

| Point | Risque | Sévérité |
|-------|--------|----------|
| Retry loop frontend (8 tentatives) | Si le webhook ET verify échouent → transaction perdue | Moyen |
| Race condition webhook vs verify | Les deux peuvent arriver simultanément | Faible (idempotence protège) |
| Subaccount Paystack non créé | Si KYC pas terminé, pas de split | Moyen |
| Stripe Connect non onboardé | Paiements échouent silencieusement | Moyen |
| Pas de queue/retry côté serveur | Si edge fn timeout, pas de retry automatique | Élevé |

---

## 5. SYSTÈME AFFILIÉ / AMBASSADEUR

### 5.1 Génération de liens

```
Utilisateur → /affiliation ou bouton "Devenir ambassadeur"
├── Génère un affiliate_link (table: affiliate_links)
│   ├── code: string unique
│   ├── organization_id
│   ├── product_id (optionnel, pour lien spécifique)
│   ├── user_id (l'affilié)
│   └── link_type: "org" | "product" | "campaign"
└── URL générée : siteviral.com/go/{code}
```

### 5.2 Tracking & Attribution

```
Clic sur /go/{code}
├── GoRedirectPage.tsx
├── useAffiliateCapture() hook
│   ├── Stocke cookie_id (localStorage + cookie 7 jours)
│   ├── Insert dans affiliate_attributions
│   │   ├── cookie_id
│   │   ├── affiliate_link_id
│   │   ├── landing_url
│   │   └── expires_at (7 jours)
│   └── Redirect vers la page cible
│
Lors d'un achat :
├── process-transaction.ts vérifie cookie_id
├── Cherche dans affiliate_attributions (non expiré, non converti)
├── Si trouvé :
│   ├── Crée affiliate_sale
│   ├── Marque attribution comme converted
│   └── Met à jour affiliate_links.total_earned
```

### 5.3 Modèle d'attribution

| Paramètre | Valeur |
|-----------|--------|
| Type | Last-click |
| Durée du cookie | 7 jours |
| Multi-device | Non (cookie-based) |
| Multi-org | Oui (un affilié peut avoir des liens pour plusieurs orgs) |

### 5.4 Edge Cases

| Cas | Comportement |
|-----|-------------|
| Plusieurs clics, même affilié | Dernier clic écrase |
| Clic affilié A puis B | Affilié B gagne (last-click) |
| Utilisateur déjà authentifié | Cookie toujours utilisé |
| Trafic direct (pas de cookie) | Pas de commission |
| Mobile / changement de navigateur | Attribution perdue |
| Expiration 7 jours | Attribution ignorée |

---

## 6. SYSTÈME CRÉATEUR

### 6.1 Structure Organisation

```
Organization
├── Identité : nom, slug, logo, banner, description
├── Leader : nom, titre, bio, photo
├── Configuration :
│   ├── category (enum: eglise, ong, createur, etc.)
│   ├── country / currency
│   ├── plan_type (free, starter, pro, enterprise)
│   ├── platform_fee_percent
│   ├── affiliation_enabled + commission_percent
│   ├── monetization_enabled
│   ├── offerings_enabled
│   └── stripe/paystack config
├── KYC : kyc_submissions (1-to-1)
├── Members : organization_members (rôles: owner, admin, member)
└── Page Settings : org_page_settings (thème, pixels, sections)
```

### 6.2 Entités liées

```
Organization
├── digital_products (produits numériques)
│   ├── product_purchases (achats)
│   ├── product_reviews (avis)
│   ├── bundle_items (si is_bundle=true)
│   └── abandoned_carts
├── donation_campaigns (campagnes de dons)
│   └── donations
├── offerings (offrandes)
│   └── offering_transactions
├── programs (formations)
│   ├── program_lessons
│   └── lesson_progress
├── events (événements)
├── media_content (vidéos, audios, articles)
│   ├── media_likes
│   └── media_saves
├── announcements (annonces)
├── org_photos (galerie photo)
├── contacts (CRM)
├── email_campaigns
├── promo_codes
├── affiliate_links
├── badges (gamification)
└── waitlists
```

### 6.3 Logique Produit vs Don vs Offrande

| Entité | Prix fixe | Montant libre | Récurrent | Fichier livrable |
|--------|-----------|---------------|-----------|-----------------|
| Produit digital | ✅ | ❌ | ❌ | ✅ (file_url) |
| Campagne de don | ❌ | ✅ | ✅ (optionnel) | ❌ |
| Offrande | ❌ | ✅ (presets) | ✅ (optionnel) | ❌ |

---

## 7. STRUCTURE DE LA BASE DE DONNÉES

### 7.1 Tables principales (~40 tables)

**Cœur plateforme :**
- `organizations` — Tenant principal
- `organization_members` — Membres et rôles
- `profiles` — Profils utilisateurs (via auth.users)
- `user_roles` — Rôles système (superadmin)

**Produits & transactions :**
- `digital_products` — Produits numériques
- `product_purchases` — Achats
- `product_reviews` — Avis
- `bundle_items` — Éléments de bundles
- `abandoned_carts` — Paniers abandonnés

**Dons & offrandes :**
- `donation_campaigns` — Campagnes
- `donations` — Transactions de dons
- `offerings` — Types d'offrandes
- `offering_transactions` — Transactions d'offrandes

**Affiliation :**
- `affiliate_links` — Liens affiliés
- `affiliate_attributions` — Tracking clicks
- `affiliate_sales` — Ventes attribuées

**Contenu :**
- `media_content` — Vidéos, audios, articles
- `media_likes` / `media_saves` — Interactions
- `announcements` — Annonces
- `events` — Événements
- `org_photos` — Photos
- `programs` / `program_lessons` / `lesson_progress` — Formations

**Communication :**
- `contacts` — CRM
- `email_campaigns` — Campagnes email
- `email_logs` — Logs d'envoi
- `notification_preferences` — Préférences

**Partenaires :**
- `partners` — Partenaires plateforme
- `partner_commissions` — Commissions partenaire
- `partner_payout_requests` — Demandes paiement

**Système :**
- `audit_logs` — Journal d'audit
- `client_events` — Analytics frontend
- `content_comments` — Commentaires
- `content_reports` — Signalements
- `content_versions` — Versioning
- `experiments` — Tests A/B
- `fraud_flags` — Alertes fraude
- `kyc_submissions` — Vérification identité
- `org_page_settings` — Configuration page
- `org_daily_metrics` — Métriques agrégées
- `promo_codes` — Codes promotionnels
- `download_logs` — Logs de téléchargement
- `badges` — Gamification
- `waitlists` / `waitlist_entries` — Listes d'attente
- `directory_applications` — Candidatures annuaire
- `short_links` — Liens courts
- `payment_events` — Idempotence paiements

### 7.2 Relations clés

```
auth.users (1) ──── (1) profiles
auth.users (1) ──── (N) organization_members
auth.users (1) ──── (N) user_roles

organizations (1) ──── (N) digital_products
organizations (1) ──── (N) donation_campaigns
organizations (1) ──── (N) offerings
organizations (1) ──── (N) programs
organizations (1) ──── (N) events
organizations (1) ──── (N) media_content
organizations (1) ──── (N) announcements
organizations (1) ──── (N) contacts
organizations (1) ──── (1) kyc_submissions
organizations (1) ──── (1) org_page_settings
organizations (1) ──── (N) affiliate_links

digital_products (1) ──── (N) product_purchases
digital_products (1) ──── (N) product_reviews
digital_products (1) ──── (N) bundle_items (self-ref)

donation_campaigns (1) ──── (N) donations
offerings (1) ──── (N) offering_transactions

affiliate_links (1) ──── (N) affiliate_attributions
affiliate_links (1) ──── (N) affiliate_sales

programs (1) ──── (N) program_lessons
program_lessons (1) ──── (N) lesson_progress
```

### 7.3 Complexité structurelle

| Zone | Complexité | Remarque |
|------|-----------|----------|
| 3 types de transactions | Élevée | donations, product_purchases, offering_transactions — schemas similaires mais tables séparées |
| Affiliation multi-table | Moyenne | links → attributions → sales, logique répartie |
| KYC + payout | Élevée | kyc_submissions + paystack_recipient + settlement logic |
| Gamification | Faible | badges + XP, logique principalement frontend |
| FTS (full-text search) | Moyenne | Colonnes fts_vector sur products, events, media, orgs |

---

## 8. STRUCTURE SEO

### 8.1 Architecture 3 couches

```
┌────────────────────────────────────────────────┐
│              COUCHE 1 : Cloudflare Worker       │
│  ├── Intercepte les requêtes des bots           │
│  ├── User-Agent detection (Googlebot, etc.)     │
│  ├── Route vers share-meta Edge Function        │
│  └── Sert du HTML statique pré-rendu            │
├────────────────────────────────────────────────┤
│              COUCHE 2 : Edge Function           │
│  ├── share-meta (Supabase Edge Function)        │
│  ├── Génère HTML avec OG tags dynamiques        │
│  ├── Récupère données depuis Supabase           │
│  │   ├── /org/:slug → org data                  │
│  │   ├── /org/:slug/product/:id → product data  │
│  │   └── etc.                                   │
│  └── Retourne HTML complet pour les crawlers    │
├────────────────────────────────────────────────┤
│              COUCHE 3 : Client-side             │
│  ├── SEOHead.tsx (react-helmet-async)           │
│  ├── Met à jour les meta tags dynamiquement     │
│  ├── OG tags, title, description                │
│  └── Utilisé pour les visiteurs humains         │
└────────────────────────────────────────────────┘
```

### 8.2 Sitemap

```
Edge Function: /sitemap
├── Génère XML dynamiquement
├── Inclut : pages statiques + orgs + produits + campagnes
├── Mis en cache (1 heure)
└── Soumis à Google Search Console
```

### 8.3 Canonical Strategy

| Type de page | URL canonique |
|-------------|---------------|
| Landing | https://siteviral.com/ |
| Org publique | https://siteviral.com/org/{slug} |
| Produit | https://siteviral.com/org/{slug}/product/{id} |
| Blog | https://siteviral.com/blog/{slug} |
| Persona | https://siteviral.com/pour/{persona} |

### 8.4 Points de risque SEO

| Risque | Détail | Sévérité |
|--------|--------|----------|
| SPA sans SSR | Google doit exécuter JS pour le contenu. Le Worker compense pour les bots | Moyen |
| Blog hardcodé | 140+ articles dans un fichier TS, pas dans la DB | Faible (fonctionne mais ne scale pas) |
| Persona pages dupliquées | 30 pages avec structure identique, risque de thin content | Moyen |
| Pas de hreflang | Pas de gestion multi-langue côté SEO | Faible |

---

## 9. PERFORMANCE & ANALYSE DE RISQUES

### 9.1 Dette technique

| Zone | Type de dette | Impact |
|------|-------------|--------|
| `blogArticles.ts` | 140+ articles hardcodés (~5000+ lignes) | Taille du bundle, maintenance |
| 30 pages persona | Code dupliqué (même template, données différentes) | Maintenance |
| 3 tables de transactions | Schémas similaires non unifiés | Complexité queries |
| CSP manuelle | Ajout au cas par cas dans index.html | Risque d'oubli |
| Edge functions monolithiques | Certaines fonctions > 300 lignes | Testabilité |

### 9.2 Composants fragiles

| Composant | Risque |
|-----------|--------|
| `process-transaction.ts` | Point central — tout casse si ça casse |
| `usePaymentGateway` | Logique de routage complexe Stripe/Paystack |
| `AuthContext` | Provider global, tout dépend de lui |
| `OrgContext` | Context imbriqué, dépend de AuthContext |
| `AppLayout` / `Sidebar` | Navigation complexe avec conditions de rôle |

### 9.3 Zones de sur-complexité

| Zone | Détail |
|------|--------|
| Gamification | XP, badges, streaks, milestones — beaucoup de code pour peu d'usage prouvé |
| Admin widgets | 20+ composants admin (SmartCRM, RevenueForecast, etc.) — la plupart peu utilisés |
| Social proof | FloatingProofToast, GlobalActivityBar, LiveActivityTicker — 3 systèmes parallèles |
| Discover widgets | FlashSale, BuyerStreak, TrendingBanner — features marketing sans validation |

---

## 10. ANALYSE DE SIMPLIFICATION

### 10.1 Ce qui peut être simplifié

| Élément | Action possible |
|---------|----------------|
| Pages persona (30) | Fusionner en 1 template + données JSON |
| Watch + Reels | Fusionner en une seule vue avec filtre |
| Feed + Discover | Unifier ou supprimer Feed |
| Widgets admin avancés | Cacher derrière un toggle "Mode avancé" |
| Social proof (3 systèmes) | Garder 1 seul |
| Blog hardcodé | Migrer vers Supabase ou CMS |

### 10.2 Ce qui peut être caché (sans supprimer)

| Élément | Stratégie |
|---------|-----------|
| Experiments (A/B) | Cacher du menu, garder fonctionnel |
| Webhooks | Réservé aux plans pro |
| Waitlists | Cacher si non utilisé |
| Revenue Simulator | Déplacer dans section avancée |
| Partner system | Cacher si < 10 partenaires actifs |

### 10.3 Ce qui ne doit PAS être touché

| Élément | Raison |
|---------|--------|
| `process-transaction.ts` | Cœur financier, critique |
| `payment_events` (idempotence) | Protection contre double-paiement |
| RLS policies | Sécurité multi-tenant |
| `kyc_submissions` | Conformité légale |
| `audit_logs` | Traçabilité |
| Affiliate attribution | Confiance des ambassadeurs |
| Stripe/Paystack webhooks | Fiabilité paiements |

### 10.4 Impact d'un pivot Ambassador-first

```
✅ Ce qui est prêt :
├── Système d'affiliation fonctionnel
├── Tracking & attribution
├── Leaderboard
├── Ambassador dashboard
├── Commission calculation
└── Share tools (WhatsApp, social)

⚠️ Ce qui doit changer :
├── Landing page → mettre l'ambassadeur en hero
├── Onboarding → "Commencez à gagner" avant "Créez votre org"
├── Navigation → Affiliation en premier dans le menu
├── Discover → trier par "potentiel de commission"
└── Persona pages → recentrer sur "gagnez de l'argent"

❌ Ce qui casserait :
├── Rien de structurel
├── Le flux créateur reste intact
└── Risque : confusion si les deux postures coexistent sans clarté
```

### 10.5 Impact d'un pivot Creator-first

```
✅ Ce qui est prêt :
├── Système org complet
├── Product/donation/offering creation
├── CRM & email campaigns
├── Analytics
├── KYC & payouts
└── Admin dashboard riche

⚠️ Ce qui doit changer :
├── Landing page → mettre la création en hero
├── Onboarding → "Créez votre boutique" en premier
├── Navigation → Admin tools en avant
├── Simplifier la marketplace (secondaire)
└── Persona pages → recentrer sur "vendez vos produits"

❌ Ce qui casserait :
├── Rien de structurel
├── Le flux ambassadeur reste intact
└── Risque : les ambassadeurs se sentent "citoyens de seconde classe"
```

---

## DIAGRAMME SYNTHÉTIQUE DU SYSTÈME

```
                    ┌──────────────────┐
                    │   CLOUDFLARE     │
                    │   Worker (SEO)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   FRONTEND       │
                    │   React SPA      │
                    │   ~120 routes    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼──────┐  ┌───▼────────┐
     │  Supabase  │  │   Edge      │  │  External  │
     │  Database  │  │  Functions  │  │  Services  │
     │  (~40 tbl) │  │  (~30 fns)  │  │            │
     │  + RLS     │  │             │  │  Stripe    │
     │  + FTS     │  │  payments   │  │  Paystack  │
     │            │  │  emails     │  │  OneSignal │
     │            │  │  webhooks   │  │  Resend    │
     │            │  │  KYC        │  │  ipapi.co  │
     └────────────┘  └─────────────┘  └────────────┘
```

---

## ZONES DE RISQUE — RÉSUMÉ

| Zone | Risque | Priorité |
|------|--------|----------|
| 🔴 Pas de retry serveur pour paiements | Transactions potentiellement perdues | Haute |
| 🟡 Blog hardcodé (5000+ lignes) | Performance bundle, maintenance | Moyenne |
| 🟡 30 persona pages dupliquées | Maintenance, SEO thin content | Moyenne |
| 🟡 3 tables de transactions séparées | Complexité requêtes analytics | Moyenne |
| 🟢 Widgets admin peu utilisés | Code mort, mais pas dangereux | Basse |
| 🟢 Social proof triple | Redondance UX | Basse |

---

*Document généré le 2 mars 2026 — Audit structurel SiteViral v1.0*
*Usage interne uniquement*
