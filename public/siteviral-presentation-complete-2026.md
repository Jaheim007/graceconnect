# 🚀 SITEVIRAL — Présentation Complète de A à Z

### Pour équipes techniques et non techniques
### Version 2.0 — 5 mars 2026

---

> **Ce document est la référence unique.** Il couvre TOUT ce que Siteviral fait aujourd'hui, comment ça fonctionne, qui fait quoi, et comment l'argent circule. Que vous soyez développeur, commercial, support client ou investisseur, vous trouverez vos réponses ici.

---

# 📋 TABLE DES MATIÈRES

| # | Section | Public cible |
|---|---------|-------------|
| 1 | [Vision & Positionnement](#1-vision--positionnement) | Tous |
| 2 | [Les 5 Acteurs du Système](#2-les-5-acteurs-du-système) | Tous |
| 3 | [Flux Financiers — Comment l'argent circule](#3-flux-financiers) | Tous |
| 4 | [Carte Complète des Fonctionnalités](#4-carte-complète-des-fonctionnalités) | Tous |
| 5 | [Parcours Utilisateur — Chaque rôle pas à pas](#5-parcours-utilisateur) | Tous |
| 6 | [Architecture Technique](#6-architecture-technique) | Technique |
| 7 | [Base de Données — Tables & Relations](#7-base-de-données) | Technique |
| 8 | [Edge Functions — Backend Serverless](#8-edge-functions) | Technique |
| 9 | [Système de Paiement — Stripe & Paystack](#9-système-de-paiement) | Technique + Finance |
| 10 | [Programme Ambassadeur — Détails Complets](#10-programme-ambassadeur) | Tous |
| 11 | [Programme Partenaire — B2B](#11-programme-partenaire) | Tous |
| 12 | [Système de Contenu & Éditeur](#12-système-de-contenu) | Technique + Créateurs |
| 13 | [SEO & Visibilité](#13-seo--visibilité) | Marketing + Technique |
| 14 | [Sécurité & Conformité](#14-sécurité--conformité) | Tous |
| 15 | [Carte de toutes les pages (~120 routes)](#15-carte-des-pages) | Tous |
| 16 | [Glossaire](#16-glossaire) | Tous |
| 17 | [FAQ Interne](#17-faq-interne) | Tous |

---

# 1. VISION & POSITIONNEMENT

## En une phrase
> **Siteviral est un centre digital tout-en-un qui permet à n'importe quelle organisation de vendre du contenu numérique, collecter des dons via Mobile Money et cartes, et monétiser via un réseau d'ambassadeurs — gratuitement.**

## Ce que Siteviral est
- 🏪 Une **boutique en ligne** spécialisée produits numériques (ebooks, cours, audio, vidéo)
- 💰 Un **système de collecte de dons** avec campagnes et offrandes
- 📢 Un **réseau d'ambassadeurs** (affiliation à 1 niveau)
- 🤝 Un **programme partenaire B2B** pour le recrutement d'organisations
- 🎯 Un **outil de gestion communautaire** (événements, annonces, photos, CRM)
- 📱 Une **PWA installable** (Progressive Web App)

## Ce que Siteviral N'est PAS
- ❌ Pas un réseau social (pas de messagerie privée, pas de "friends")
- ❌ Pas du MLM (un seul niveau de commission, pas de pyramide)
- ❌ Pas une marketplace de produits physiques
- ❌ Pas un SaaS avec abonnement mensuel

## Proposition de valeur unique

| Concurrent | Ce qu'il fait | Ce que Siteviral fait EN PLUS |
|-----------|--------------|-------------------------------|
| Gumroad | Vente produits numériques | ✅ Mobile Money + Ambassadeurs + Dons |
| GoFundMe | Collecte de dons | ✅ Vente produits + Ambassadeurs + Afrique |
| Shopify | E-commerce avec abonnement | ✅ Gratuit + Mobile Money + Communauté |
| Amazon KDP | Vente de livres | ✅ Contrôle total + 90% des revenus |

## Modèle économique
- **Zéro abonnement** — l'inscription est gratuite
- **Commission de 10%** uniquement sur les transactions réalisées
- **Si l'organisation ne vend rien → Siteviral ne gagne rien**

---

# 2. LES 5 ACTEURS DU SYSTÈME

## 🏢 Acteur 1 : L'Organisation (le vendeur/créateur)

**Qui :** Église, association, ONG, formateur, auteur, musicien, coach, école en ligne, leader communautaire.

**Ce qu'elle fait :**
- Crée sa page publique (mini-site web gratuit)
- Publie et vend des produits numériques
- Lance des campagnes de dons et reçoit des offrandes
- Publie des événements, annonces, photos
- Crée des programmes de formation (modules + leçons)
- Active le programme ambassadeur
- Gère ses contacts (CRM) et envoie des emails/notifications
- Suit ses ventes, revenus et statistiques

**Ce qu'elle gagne :** **90%** de chaque vente (sans ambassadeur) ou **80%** (avec ambassadeur à 10%)

**Ce qu'elle paie :** Rien à l'inscription. **10% de commission** uniquement quand elle gagne de l'argent.

---

## 🛒 Acteur 2 : L'Acheteur / Donateur

**Qui :** Toute personne qui achète un produit ou fait un don.

**Ce qu'il fait :**
- Découvre des organisations et produits via la marketplace
- Achète par Mobile Money (Orange, MTN, Moov) ou carte bancaire (Visa, MC)
- Fait des dons aux campagnes et offrandes
- Télécharge ses achats immédiatement (avec filigrane de protection)
- Accède à ses achats, factures et programmes depuis son espace personnel
- Peut sauvegarder des favoris (bookmarks)

**Ce qu'il paie :** Le prix affiché. Aucun frais caché.

---

## 📢 Acteur 3 : L'Ambassadeur (affilié)

**Qui :** N'importe quel utilisateur inscrit qui veut gagner de l'argent en recommandant des produits.

**Comment ça marche :**
1. S'inscrit gratuitement
2. Va sur un produit → clique "Devenir ambassadeur" → obtient un lien unique
3. Partage le lien (WhatsApp, Facebook, etc.)
4. Quand quelqu'un achète via ce lien → commission automatique

**Ce qu'il gagne :** Entre **5% et 50%** selon ce que l'organisation configure (10% par défaut)

**Règles clés :**
- ❌ **JAMAIS de commission sur les dons** (règle éthique absolue)
- ❌ **Pas d'auto-achat** (on ne peut pas acheter via son propre lien)
- ⏱️ **Délai de 15 jours** avant de pouvoir retirer les commissions
- 1️⃣ **Un seul niveau** — pas de MLM, pas de recrutement d'ambassadeurs

---

## 🤝 Acteur 4 : Le Partenaire Stratégique

**Qui :** Apporteur d'affaires B2B qui recrute des ORGANISATIONS (pas des acheteurs).

**Comment ça marche :**
1. Candidate via /devenir-partenaire (formulaire détaillé)
2. Validé par l'équipe Siteviral
3. Reçoit un code d'invitation unique
4. Démarche des organisations → elles s'inscrivent via son lien
5. Gagne un % de la **part Siteviral** (pas de la part du vendeur)

**Progression :**

| Niveau | Nom | Orgs actives | Commission |
|--------|-----|-------------|------------|
| 1 | 🥉 Bronze | 10+ | 5% |
| 2 | 🥈 Silver | 50+ | 8% |
| 3 | 🥇 Gold | 150+ | 10% |
| 4 | 💎 Platinum | 300+ | 12% |
| 5 | 👑 Diamond | 1 000+ | 15% |

**Différence clé :** L'ambassadeur promeut des PRODUITS auprès d'acheteurs. Le partenaire recrute des ORGANISATIONS sur la plateforme.

---

## 🏗️ Acteur 5 : Siteviral (la plateforme)

**Ce qu'elle fait :**
- Fournit toute la technologie
- Gère la répartition automatique des paiements
- Assure la sécurité (KYC, anti-fraude, filigranes)
- Opère les programmes ambassadeur et partenaire
- Support client

**Ce qu'elle gagne :** **10% de commission** sur chaque transaction.

---

# 3. FLUX FINANCIERS

## 3.1 Répartition standard

### Vente simple (sans ambassadeur)
```
Produit vendu à 10 000 FCFA
├── Organisation : 9 000 FCFA (90%)
└── Siteviral    : 1 000 FCFA (10%)
```

### Vente avec ambassadeur (commission 10%)
```
Produit vendu à 10 000 FCFA via lien ambassadeur
├── Organisation : 8 000 FCFA (80%)
├── Ambassadeur  : 1 000 FCFA (10%)
└── Siteviral    : 1 000 FCFA (10%)
```

### Don (campagne ou offrande)
```
Don de 10 000 FCFA
├── Organisation : 9 000 FCFA (90%)
├── Ambassadeur  : 0 FCFA (JAMAIS de commission sur les dons)
└── Siteviral    : 1 000 FCFA (10%)
```

### Avec partenaire (ex: Bronze 5%)
```
Vente 10 000 FCFA + ambassadeur + org référée par partenaire
├── Organisation : 8 000 FCFA (80%)
├── Ambassadeur  : 1 000 FCFA (10%)
├── Siteviral    :   950 FCFA (9,5%)
└── Partenaire   :    50 FCFA (5% de la part Siteviral)
```

> 💡 **Le partenaire ne prend RIEN au vendeur.** Il partage la marge de Siteviral. Le vendeur reçoit exactement la même chose.

## 3.2 Moyens de paiement

| Moyen | Processeur | Zones | Devises |
|-------|-----------|-------|---------|
| **Mobile Money** | Paystack | Afrique (CI, SN, CM, GH, NG, KE) | XOF, NGN, GHS, KES, ZAR |
| **Carte bancaire** | Stripe | Monde entier (190+ pays) | USD, EUR, GBP + 135 devises |

**Détection automatique :** Le système détecte le pays de l'acheteur et propose le moyen le plus adapté (Mobile Money en Afrique, carte ailleurs). L'acheteur peut toujours choisir manuellement.

## 3.3 Délais de sécurité

| Type | Délai | Pourquoi |
|------|-------|----------|
| Rétention vendeur | 3 jours | Protection contre remboursements/contestations |
| Rétention ambassadeur | 15 jours | Vérification anti-fraude |
| Traitement versement | 3-8 jours ouvrés | Revue + transfert MoMo/banque |

## 3.4 KYC (Vérification d'identité)

- **Jamais demandé à l'inscription** — seulement au premier retrait
- Modèle "Vendez d'abord, vérifiez ensuite"
- Documents : CNI/passeport + coordonnées bancaires/MoMo
- Vérifié par Paystack/Stripe (pas par Siteviral)
- Siteviral ne stocke PAS les documents d'identité

---

# 4. CARTE COMPLÈTE DES FONCTIONNALITÉS

## 4.1 Pour l'Organisation (Créateur)

| Catégorie | Fonctionnalités |
|-----------|----------------|
| **Identité** | Page publique, logo, bannière, description, leader, catégorie, couleurs personnalisées |
| **Produits** | Création/édition, upload fichier (PDF/audio/vidéo), prix libre ou fixe, produit gratuit, bundles, aperçu automatique, FAQ, témoignages, ordre d'affichage |
| **Dons** | Campagnes avec objectif et jauge, offrandes récurrentes avec montants prédéfinis |
| **Programmes** | Formations structurées (modules + leçons), suivi de progression |
| **Contenu** | Médias (vidéo/audio/article), galerie photos, annonces, événements |
| **Commerce** | Codes promo, paniers abandonnés (relance auto), order bumps, upsells |
| **Ambassadeurs** | Activation/config du programme, taux de commission configurable (5-50%) |
| **CRM** | Contacts, tags, import/export, segmentation |
| **Communication** | Campagnes email (par tags), notifications push |
| **Analytics** | Dashboard temps réel, revenus, ventes, vues, conversions, prévisions |
| **Finance** | Suivi des ventes, demandes de versement, historique |
| **Avancé** | Webhooks, tests A/B, listes d'attente, import YouTube (RSS) |
| **KYC** | Soumission d'identité, statut de vérification |
| **Page** | Ordre des sections, sections masquées, pixels tracking (Facebook, Google, TikTok) |

## 4.2 Pour l'Acheteur / Donateur

| Fonctionnalité | Description |
|----------------|-------------|
| Marketplace | Découverte d'organisations et produits |
| Achat | Paiement Mobile Money ou carte |
| Dons | Contribution aux campagnes et offrandes |
| Téléchargement | Accès immédiat aux achats (avec filigrane) |
| Programmes | Inscription et suivi de formations |
| Favoris | Bookmarks de produits et médias |
| Profil | Gestion de compte, avatar, informations |
| Factures | Historique des achats et téléchargement de factures |
| Notifications | Alertes et préférences personnalisables |

## 4.3 Pour l'Ambassadeur

| Fonctionnalité | Description |
|----------------|-------------|
| Liens affiliés | Génération par produit, organisation ou campagne |
| Dashboard | Clics, conversions, commissions en temps réel |
| Classement | Leaderboard multi-organisations |
| Objectifs | Tracker de performance avec milestones |
| Outils de partage | Boutons WhatsApp, copie de lien |
| Retraits | Demande de versement (après 15 jours) |

## 4.4 Pour le Partenaire

| Fonctionnalité | Description |
|----------------|-------------|
| Portail dédié | Vue des organisations référées et commissions |
| Code d'invitation | Lien unique pour recruter des organisations |
| Progression | Niveaux Bronze → Diamond avec commissions croissantes |
| Retraits | Demande de versement (seuil minimum 5 000 XOF) |

## 4.5 Pour le Superadmin (plateforme)

| Fonctionnalité | Description |
|----------------|-------------|
| Dashboard global | Métriques GMV, utilisateurs, organisations |
| Gestion utilisateurs | Liste, recherche, détails |
| Gestion organisations | Annuaire, vérification, suspension |
| Gestion partenaires | Approbation, niveaux, suspension |
| Transactions | Vue globale de toutes les transactions |
| Règlements (settlements) | Libération des fonds, suivi |
| KYC | Revue et validation des soumissions |
| Risque/AML | Alertes fraude, flags |
| Logs email | Suivi de tous les emails envoyés |
| Notifications push | Envoi ciblé de notifications |
| Support | Tickets et demandes |
| Exports | Export CSV de données |
| Vue investisseur | Snapshot métriques pour investisseurs |
| Chat IA | Assistant IA pour analyse de données |
| Paramètres | Configuration globale de la plateforme |

---

# 5. PARCOURS UTILISATEUR

## 5.1 Parcours Visiteur → Acheteur
```
1. Arrive sur siteviral.com (SEO, lien partagé, pub)
2. Découvre la page d'accueil avec les fonctionnalités
3. Explore la marketplace ou une page d'organisation
4. Clique sur un produit → voit la description, le prix, les avis
5. Clique "Acheter" → entre nom, email, téléphone
6. Choisit Mobile Money ou Carte → paie
7. Reçoit l'accès immédiat + email de confirmation
8. Télécharge le produit (avec filigrane protecteur)
```

## 5.2 Parcours Visiteur → Créateur
```
1. Arrive sur /vendre ou landing page
2. S'inscrit (email ou Google)
3. Post-inscription → /welcome → choisit son intention
4. Clique "Créer une organisation"
5. Remplit : nom, description, catégorie, logo
6. Page publique en ligne immédiatement
7. Publie son premier produit
8. Partage le lien de sa page
9. Reçoit ses premières ventes
10. Soumet KYC → demande son premier versement
```

## 5.3 Parcours Visiteur → Ambassadeur
```
1. Arrive sur /gagner ou /ambassador
2. S'inscrit gratuitement
3. Explore la marketplace
4. Trouve un produit à promouvoir
5. Clique "Devenir ambassadeur" → obtient son lien unique
6. Partage le lien sur WhatsApp, réseaux sociaux
7. Suit ses clics et conversions dans son dashboard
8. Après 15 jours → demande versement des commissions
```

## 5.4 Parcours Partenaire
```
1. Arrive sur /devenir-partenaire
2. Remplit le formulaire complet (identité, réseau, motivation)
3. Candidature examinée par l'équipe Siteviral
4. Si approuvé → reçoit code d'invitation
5. Démarche des organisations
6. Organisations s'inscrivent via son lien
7. Quand elles vendent → commission sur la part Siteviral
8. Progression automatique de niveau (Bronze → Diamond)
```

---

# 6. ARCHITECTURE TECHNIQUE

## 6.1 Stack technologique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Frontend** | React 18 + TypeScript + Vite | Application SPA |
| **Styling** | Tailwind CSS + shadcn/ui | Design system |
| **Routing** | React Router v6 | Navigation SPA |
| **State** | TanStack React Query + Context API | Gestion d'état & cache |
| **Animations** | Framer Motion | Transitions et animations |
| **Backend** | Supabase (PostgreSQL + Edge Functions) | Base de données, auth, serverless |
| **Auth** | Supabase Auth (email, Google OAuth) | Authentification |
| **Storage** | Supabase Storage | Fichiers (produits, images) |
| **Paiements** | Paystack (Mobile Money) + Stripe (cartes) | Traitement des paiements |
| **Emails** | Resend | Emails transactionnels |
| **Push** | OneSignal | Notifications push |
| **CDN/SEO** | Cloudflare Workers | SEO dynamique pour SPA |
| **PWA** | vite-plugin-pwa | Application installable |
| **Éditeur** | Tiptap (ProseMirror) | Éditeur de texte riche |
| **IA** | Google Gemini | Assistant de rédaction |

## 6.2 Architecture globale

```
┌──────────────────────────────────────────────────────┐
│                   CLOUDFLARE                          │
│  CDN + Worker (SEO dynamique pour bots)               │
└──────────────┬───────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────┐
│              FRONTEND — React SPA                     │
│  ~120 routes | Lazy loading | PWA installable         │
│                                                       │
│  Providers : Auth → Org → Mode → Theme → I18n         │
│  Layouts : PublicLayout | AppLayout | AdminShell      │
│            SuperadminLayout                            │
│  Guards : RequireAuth | RequireSuperadmin              │
│           RequireOrgManage                             │
└──────────────┬───────────────────────────────────────┘
               │
    ┌──────────┼──────────┬───────────────┐
    │          │          │               │
┌───▼────┐ ┌──▼─────┐ ┌──▼──────┐ ┌─────▼──────┐
│Supabase│ │Edge    │ │Stripe   │ │Paystack    │
│Database│ │Funcs   │ │(cartes) │ │(MoMo)      │
│~40 tbl │ │~38 fns │ │         │ │            │
│+ RLS   │ │        │ │Webhooks │ │Webhooks    │
│+ FTS   │ │        │ │Connect  │ │Subaccounts │
└────────┘ └────────┘ └─────────┘ └────────────┘
                │
         ┌──────┼──────┐
         │      │      │
      ┌──▼──┐ ┌▼───┐ ┌▼──────┐
      │Resend│ │One │ │ipapi  │
      │Email │ │Sig │ │Geo IP │
      └─────┘ └────┘ └───────┘
```

## 6.3 Contexts React (couches d'état)

| Context | Rôle | Dépendances |
|---------|------|-------------|
| `I18nProvider` | Internationalisation (FR par défaut) | — |
| `ThemeProvider` | Thème clair/sombre | — |
| `AuthProvider` | Session utilisateur, profil, rôles | Supabase Auth |
| `OrgProvider` | Organisation sélectionnée, rôle dans l'org | AuthContext |
| `ModeProvider` | Mode actif (acheteur/créateur/ambassadeur) | AuthContext + OrgContext |

## 6.4 Hooks personnalisés clés (~45 hooks)

| Hook | Responsabilité |
|------|---------------|
| `usePaymentGateway` | Détection et routage Stripe/Paystack selon le pays |
| `usePaystack` | Intégration Paystack inline |
| `useAffiliateCapture` | Capture de cookie affilié lors du clic sur un lien |
| `useGamification` | XP, badges, streaks, milestones |
| `useMonetization` | Logique de monétisation (prix, promos, sale) |
| `useProductReviews` | Avis produits |
| `usePrograms` | Gestion des programmes de formation |
| `useOfferings` | Gestion des offrandes |
| `useNotifications` | Notifications in-app |
| `usePushNotifications` | Notifications push OneSignal |
| `useClientAnalytics` | Tracking d'événements frontend |
| `useExperiment` | Tests A/B |
| `useLocalCurrency` | Conversion et affichage de devises |
| `useImageOptimizer` | Compression WebP automatique |
| `useOrgRole` | Rôle de l'utilisateur dans une organisation |
| `usePartner` | Logique du programme partenaire |
| `useSubscriptions` | Gestion des abonnements |
| `useWaitlists` | Listes d'attente |
| `usePWAInstall` | Prompt d'installation PWA |
| `useShortLink` | Création de liens courts |
| `useMaintenanceMode` | Mode maintenance |

---

# 7. BASE DE DONNÉES

## 7.1 Vue d'ensemble
- **~40+ tables** PostgreSQL via Supabase
- **RLS (Row Level Security)** sur toutes les tables sensibles
- **Full-Text Search** sur produits, événements, médias, organisations
- **Idempotence** des paiements via table `payment_events`

## 7.2 Tables par domaine

### Cœur plateforme
| Table | Description |
|-------|-------------|
| `organizations` | Tenant principal — tout tourne autour de cette table |
| `organization_members` | Membres et rôles (owner, admin, member) |
| `profiles` | Profils utilisateurs (liés à auth.users) |
| `user_roles` | Rôles système (superadmin) — table séparée pour sécurité |

### Produits & Commerce
| Table | Description |
|-------|-------------|
| `digital_products` | Produits numériques (titre, prix, fichier, cover, slug, FAQ, etc.) |
| `product_purchases` | Achats (montant, gateway, buyer info, status) |
| `product_reviews` | Avis et notes (1-5 étoiles) |
| `bundle_items` | Éléments d'un bundle (produit composite) |
| `abandoned_carts` | Paniers abandonnés (relance automatique) |
| `promo_codes` | Codes promotionnels (%, montant fixe, usage limité) |

### Dons & Offrandes
| Table | Description |
|-------|-------------|
| `donation_campaigns` | Campagnes de dons avec objectif et date de fin |
| `donations` | Transactions de dons |
| `offerings` | Types d'offrandes récurrentes |
| `offering_transactions` | Transactions d'offrandes |

### Affiliation
| Table | Description |
|-------|-------------|
| `affiliate_links` | Liens affiliés (code, org, produit, type) |
| `affiliate_attributions` | Tracking des clics (cookie 7 jours) |
| `affiliate_sales` | Ventes attribuées + commissions |

### Contenu
| Table | Description |
|-------|-------------|
| `media_content` | Vidéos, audios, articles |
| `media_likes` / `media_saves` | Interactions utilisateur |
| `announcements` | Annonces de la communauté |
| `events` | Événements (date, lieu, description) |
| `org_photos` | Galerie photos |
| `programs` / `program_lessons` / `lesson_progress` | Formations structurées |

### Communication
| Table | Description |
|-------|-------------|
| `contacts` | CRM (email, nom, tags, source) |
| `email_campaigns` | Campagnes email (sujet, corps, tags cibles) |
| `email_logs` | Logs de tous les emails envoyés |
| `notification_preferences` | Préférences par utilisateur |

### Partenaires
| Table | Description |
|-------|-------------|
| `partners` | Partenaires B2B (niveau, statut, commission) |
| `partner_commissions` | Commissions gagnées |
| `partner_payout_requests` | Demandes de versement |

### Système
| Table | Description |
|-------|-------------|
| `audit_logs` | Journal d'audit (action, user, resource) |
| `client_events` | Analytics frontend (événements, device, page) |
| `content_comments` | Commentaires (avec réponses hiérarchiques) |
| `content_reports` | Signalements de contenu |
| `content_versions` | Versioning du contenu |
| `experiments` | Tests A/B |
| `fraud_flags` | Alertes fraude |
| `kyc_submissions` | Vérification d'identité (1-to-1 avec org) |
| `org_page_settings` | Configuration page (thème, pixels, sections) |
| `org_daily_metrics` | Métriques agrégées quotidiennes |
| `download_logs` | Logs de téléchargement |
| `badges` | Gamification |
| `payment_events` | Idempotence des paiements |
| `short_links` | Liens courts |
| `directory_applications` | Candidatures à l'annuaire |

## 7.3 Relations clés (schéma simplifié)

```
auth.users ──(1:1)── profiles
auth.users ──(1:N)── organization_members
auth.users ──(1:N)── user_roles

organizations ──(1:N)── digital_products
                ──(1:N)── donation_campaigns
                ──(1:N)── offerings
                ──(1:N)── programs
                ──(1:N)── events
                ──(1:N)── media_content
                ──(1:N)── announcements
                ──(1:N)── contacts
                ──(1:N)── affiliate_links
                ──(1:1)── kyc_submissions
                ──(1:1)── org_page_settings

digital_products ──(1:N)── product_purchases
                  ──(1:N)── product_reviews
                  ──(1:N)── bundle_items

donation_campaigns ──(1:N)── donations
offerings ──(1:N)── offering_transactions

affiliate_links ──(1:N)── affiliate_attributions
                ──(1:N)── affiliate_sales

programs ──(1:N)── program_lessons
program_lessons ──(1:N)── lesson_progress
```

---

# 8. EDGE FUNCTIONS (BACKEND SERVERLESS)

## 8.1 Liste complète (~38 fonctions)

### Paiements & Transactions
| Fonction | Rôle |
|----------|------|
| `verify-payment` | Vérifie un paiement Paystack et finalise la transaction |
| `paystack-webhook` | Reçoit les webhooks Paystack (backup idempotent) |
| `stripe-create-checkout` | Crée une session Stripe Checkout |
| `stripe-webhook` | Reçoit les webhooks Stripe |
| `stripe-verify` | Vérifie le statut d'une session Stripe |
| `stripe-connect-onboarding` | Onboarding Stripe Connect pour les vendeurs |
| `stripe-connect-status` | Vérifie le statut Stripe Connect |
| `claim-free-product` | Attribution d'un produit gratuit |
| `refund-transaction` | Remboursement d'une transaction |

### Versements (Payouts)
| Fonction | Rôle |
|----------|------|
| `process-payout` | Traitement d'un versement vendeur |
| `process-partner-payout` | Versement partenaire |
| `request-affiliate-payout` | Demande de versement ambassadeur |
| `request-partner-payout` | Demande de versement partenaire |
| `release-settlement` | Libération des fonds retenus |
| `settle-pre-subaccount` | Règlement des transactions pré-subaccount |
| `create-transfer-recipient` | Création du destinataire de transfert (Paystack) |
| `create-transfer-recipient-partner` | Idem pour les partenaires |
| `create-paystack-subaccount` | Création de sous-compte Paystack |
| `check-payout-capabilities` | Vérification des capacités de versement |

### Communication
| Fonction | Rôle |
|----------|------|
| `send-email` | Envoi d'email transactionnel (Resend) |
| `send-campaign` | Envoi de campagne email en masse |
| `automated-emails` | Emails automatisés (bienvenue, relance panier, etc.) |
| `send-push` | Envoi de notification push (OneSignal) |
| `on-notification-created` | Trigger sur création de notification |
| `onesignal-test-push` | Test de notification push |

### Contenu & Médias
| Fonction | Rôle |
|----------|------|
| `ai-write-content` | Assistant IA de rédaction (Gemini) |
| `youtube-channel-import` | Import de chaîne YouTube via RSS |
| `generate-preview` | Génération d'aperçu de produit (PDF) |
| `watermark-download` | Téléchargement avec filigrane de protection |
| `generate-signed-url` | URL signée pour fichiers privés |

### SEO & Partage
| Fonction | Rôle |
|----------|------|
| `share-meta` | Méta-données OG dynamiques pour les bots |
| `og-proxy` | Proxy pour images OpenGraph |
| `sitemap` | Génération du sitemap XML dynamique |

### Système
| Fonction | Rôle |
|----------|------|
| `aggregate-metrics` | Agrégation quotidienne des métriques |
| `superadmin-ai-chat` | Chat IA pour le superadmin |
| `backfill-purchase-emails` | Backfill des emails d'achats |
| `migrate-subaccounts` | Migration des sous-comptes |

### Logique partagée (_shared/)
| Module | Rôle |
|--------|------|
| `process-transaction.ts` | **CŒUR** — logique de traitement de toutes les transactions |
| `cors.ts` | Headers CORS |
| Autres utilitaires | Helpers partagés |

---

# 9. SYSTÈME DE PAIEMENT

## 9.1 Flux de paiement détaillé

```
┌─ ACHETEUR ──────────────────────────────────────────────┐
│                                                          │
│  usePaymentGateway() → détecte le pays                   │
│  ├── Afrique → Paystack (Mobile Money)                   │
│  └── International → Stripe (carte bancaire)             │
│                                                          │
│  PAYSTACK FLOW :                                         │
│  1. Popup Paystack inline dans le navigateur              │
│  2. Acheteur valide (code PIN MoMo ou carte)              │
│  3. onSuccess → appel verify-payment (edge fn)            │
│  4. verify-payment vérifie via API Paystack               │
│  5. → process-transaction.ts (logique partagée)           │
│  6. Webhook paystack-webhook (backup idempotent)          │
│                                                          │
│  STRIPE FLOW :                                           │
│  1. stripe-create-checkout → crée session Checkout        │
│  2. Redirect vers page hébergée Stripe                    │
│  3. Acheteur paie sur la page Stripe                      │
│  4. Webhook stripe-webhook → process-transaction.ts       │
│  5. Redirect retour → /payment-success                    │
│                                                          │
│  process-transaction.ts (LOGIQUE CENTRALE) :              │
│  ├── Vérification idempotence (payment_events)            │
│  ├── Calcul : platform_fee = montant × 10%               │
│  ├── org_amount = montant - platform_fee                  │
│  ├── Si affilié : commission = org_amount × commission%   │
│  ├── Insert dans table de transaction                     │
│  ├── Update compteurs (sales_count, current_amount)       │
│  ├── Attribution affilié si applicable                    │
│  ├── Envoi email confirmation                             │
│  ├── Webhook org (si configuré)                           │
│  └── Gamification (XP, badges)                            │
└──────────────────────────────────────────────────────────┘
```

## 9.2 Protection anti-fraude

| Mécanisme | Description |
|-----------|-------------|
| Idempotence | Table `payment_events` — empêche le double-traitement |
| Délais de rétention | 3 jours vendeur, 15 jours ambassadeur |
| Anti-auto-achat | Vérification que l'ambassadeur n'achète pas via son propre lien |
| Filigrane | Nom de l'acheteur inscrit sur chaque fichier téléchargé |
| Fraud flags | Alertes automatiques sur comportements suspects |
| KYC | Vérification d'identité avant tout versement |
| Logs d'audit | Traçabilité complète de toutes les actions |

---

# 10. PROGRAMME AMBASSADEUR — DÉTAILS COMPLETS

## 10.1 Modèle d'attribution

| Paramètre | Valeur |
|-----------|--------|
| Type d'attribution | **Last-click** (le dernier lien cliqué gagne) |
| Durée du cookie | **7 jours** |
| Multi-device | Non (basé sur cookie/localStorage) |
| Multi-org | Oui (un ambassadeur peut promouvoir plusieurs orgs) |

## 10.2 Flux technique

```
1. Ambassadeur génère un lien → siteviral.com/go/{code}
2. Acheteur clique → GoRedirectPage.tsx
3. useAffiliateCapture() :
   ├── Stocke cookie_id (localStorage + cookie 7 jours)
   ├── Insert dans affiliate_attributions
   └── Redirect vers la page cible
4. Lors d'un achat → process-transaction.ts :
   ├── Lit le cookie_id
   ├── Cherche dans affiliate_attributions (non expiré, non converti)
   ├── Si trouvé : crée affiliate_sale, marque comme converti
   └── Met à jour affiliate_links.total_earned
```

## 10.3 Types de liens

| Type | URL générée | Usage |
|------|------------|-------|
| `org` | /go/{code} → /org/{slug} | Promotion d'une organisation |
| `product` | /go/{code} → /org/{slug}/product/{id} | Promotion d'un produit spécifique |
| `campaign` | /go/{code} → /campaign/{id} | Promotion d'une campagne de dons |

---

# 11. PROGRAMME PARTENAIRE — B2B

## 11.1 Candidature

Le formulaire /devenir-partenaire collecte :
- Identité complète
- Taille du réseau
- Motivations
- Expérience en apport d'affaires

## 11.2 Cycle de vie

```
1. Candidature → statut "pending"
2. Revue superadmin → "approved" ou "rejected"
3. Si approuvé → code unique + lien d'invitation
4. Persistance "guest-to-login" via sessionStorage
5. Attribution par lien ?partner=CODE
6. Activation au premier paiement d'une org référée
7. Progression automatique de niveau
```

## 11.3 Commission

La commission du partenaire est prise sur la **part Siteviral**, pas sur celle du vendeur :

```
Commission partenaire = part_siteviral × taux_niveau_partenaire
```

---

# 12. SYSTÈME DE CONTENU

## 12.1 Éditeur de texte riche (Tiptap)

L'éditeur est utilisé pour les descriptions de produits, annonces, événements, etc. Il offre :

| Fonctionnalité | Description |
|----------------|-------------|
| Formatage | Gras, italique, souligné, barré |
| Titres | H2, H3 |
| Listes | À puces, numérotées |
| Citation | Blockquote |
| Code | Blocs de code avec coloration syntaxique (lowlight) |
| Alignement | Gauche, centre, droite |
| Liens | URL cliquables |
| Images | Upload avec compression WebP auto (max 5 Mo, cap 1200px) |
| Vidéos | Intégration YouTube, TikTok, Vimeo, Dailymotion, Twitter/X, Instagram |
| Tableaux | Insertion avec gestion lignes/colonnes |
| Emojis | Sélecteur intégré par catégories |
| Couleurs | Palette de couleurs pour le texte |
| IA | Assistant de rédaction (Gemini) pour générer du contenu |
| Copier-coller | Support du collage d'images depuis le presse-papier |
| Drag & drop | Glisser-déposer d'images directement dans l'éditeur |

## 12.2 Système de produits numériques

| Caractéristique | Détail |
|-----------------|--------|
| Types de fichiers | PDF, audio (MP3, M4A), vidéo (MP4), documents |
| Taille max | Configurable par storage bucket |
| Aperçu automatique | 20% du PDF (min 1 page, max 5 pages) avec flou sur la dernière |
| Filigrane | Nom de l'acheteur inscrit sur les téléchargements |
| Bundles | Regroupement de plusieurs produits en un |
| Order bumps | Produit suggéré lors de l'achat |
| Upsells | Produits complémentaires affichés |
| FAQ & témoignages | JSON intégré par produit |
| Avis | Notation 1-5 étoiles avec commentaires |

## 12.3 Stockage

| Bucket | Visibilité | Usage |
|--------|-----------|-------|
| `org-uploads` | Public | Logos, images, médias, images de l'éditeur |
| `kyc-documents` | Privé (RLS) | Documents d'identité — accès par URL signée uniquement |

---

# 13. SEO & VISIBILITÉ

## 13.1 Architecture 3 couches

```
COUCHE 1 : Cloudflare Worker
├── Intercepte les requêtes des bots (Googlebot, etc.)
├── Route vers share-meta Edge Function
└── Sert du HTML pré-rendu avec OG tags

COUCHE 2 : Edge Function (share-meta)
├── Génère HTML avec méta-données dynamiques
├── Récupère les données depuis Supabase
└── Retourne HTML complet pour les crawlers

COUCHE 3 : Client-side (React)
├── SEOHead composant (méta-données dynamiques)
├── Met à jour title, description, OG tags
└── Pour les visiteurs humains (SPA standard)
```

## 13.2 Pages SEO

| Type | Nombre | Exemples |
|------|--------|----------|
| Landing pages | ~15 | /, /features, /about, /faq, /contact |
| Pages persona | ~30 | /pour/eglises, /pour/formateurs, /pour/ong |
| Guides SEO | ~9 | /guide/vendre-ebook-afrique |
| Blog | ~140 articles | /blog/{slug} |
| Pages légales | ~12 | /terms, /privacy, /refund-policy |
| Pages dynamiques | Illimitées | /org/{slug}, /org/{slug}/product/{id} |

## 13.3 SEO technique

- Sitemap XML dynamique (edge function, cache 1h)
- robots.txt
- Canonical tags sur toutes les pages
- JSON-LD (schema.org) selon le type de page
- Alt text sur les images
- Méta descriptions uniques

## 13.4 Fallback SEO global

```
Titre: "Siteviral — Votre Centre Digital tout-en-un Gratuit"
Description: "Votre centre digital tout-en-un. Gratuit. Vendez vos produits 
              numériques, collectez des dons via Mobile Money et cartes, 
              et gagnez en partageant."
Image: https://siteviral.com/og-image.png
```

---

# 14. SÉCURITÉ & CONFORMITÉ

## 14.1 Sécurité des données

| Mesure | Description |
|--------|-------------|
| **RLS** | Row Level Security sur toutes les tables — isolation multi-tenant |
| **Auth** | Supabase Auth avec tokens JWT |
| **Rôles** | Table `user_roles` séparée (pas sur le profil) — anti-escalade de privilèges |
| **KYC** | Vérification d'identité obligatoire avant versement |
| **Filigrane** | Protection des fichiers téléchargés |
| **Logs d'audit** | Traçabilité complète des actions sensibles |
| **Idempotence** | Protection contre le double-traitement des paiements |
| **Anti-fraude** | Flags automatiques, détection d'auto-achat |
| **GDPR** | Bannière de consentement cookies |
| **URLs signées** | Accès sécurisé aux fichiers privés (KYC) |

## 14.2 Pages légales

| Page | Route |
|------|-------|
| Conditions d'utilisation | /terms |
| Politique de confidentialité | /privacy |
| Politique de remboursement | /refund-policy |
| Usage acceptable | /acceptable-use |
| Conformité | /compliance |
| Sécurité | /security |
| Anti-blanchiment (AML) | /aml |
| Protection des données (DPA) | /dpa |
| Sous-traitants | /subprocessors |
| Politique de paiement | /payout-policy |
| Conditions ambassadeur | /ambassador-terms |
| Conditions partenaire | /partner-terms |

## 14.3 Principes clés

- **Neutralité inclusive** — la plateforme est adaptée à tout type d'organisation (religieuse, éducative, associative, commerciale)
- **Étanchéité des rôles** — l'acheteur voit une marketplace neutre, l'ambassadeur voit les gains, le créateur voit les outils business
- **Aucune donnée bancaire stockée** — tout passe par Paystack/Stripe
- **Mot de passe hashé** — jamais stocké en clair

---

# 15. CARTE DES PAGES (~120 ROUTES)

## 15.1 Pages publiques (SEO, accessibles sans compte)

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/features` | Fonctionnalités |
| `/about` | À propos |
| `/contact` | Contact |
| `/faq` | FAQ |
| `/temoignages` | Témoignages |
| `/etudes-de-cas` | Études de cas |
| `/presse` | Page presse |
| `/changelog` | Changelog |
| `/status` | Statut plateforme |
| `/install` | Installation PWA |
| `/comparer` | Comparateur |
| `/calculateur` | Calculateur de revenus |
| `/gagner` | Landing ambassadeur |
| `/vendre` | Landing créateur |
| `/ambassador` | Programme ambassadeur |
| `/devenir-partenaire` | Candidature partenaire |
| `/partenaires` | Page partenaires |
| `/blog` | Index blog (~140 articles) |
| `/blog/:slug` | Article de blog |
| `/guide/*` | 9 guides SEO longs |
| `/pour/*` | ~30 pages persona |
| `/help` | Centre d'aide |
| `/marketplace` | Marketplace (Le Hub) |

## 15.2 Pages légales

| Route | Page |
|-------|------|
| `/terms` | CGU |
| `/privacy` | Confidentialité |
| `/refund-policy` | Remboursement |
| `/payout-policy` | Versements |
| `/acceptable-use` | Usage acceptable |
| `/compliance` | Conformité |
| `/security` | Sécurité |
| `/aml` | Anti-blanchiment |
| `/dpa` | Protection données |
| `/subprocessors` | Sous-traitants |
| `/ambassador-terms` | Conditions ambassadeur |
| `/partner-terms` | Conditions partenaire |

## 15.3 Pages publiques dynamiques (contenu d'organisations)

| Route | Description |
|-------|-------------|
| `/org/:slug` | Page publique d'organisation |
| `/org/:slug/product/:id` | Détail produit |
| `/org/:slug/p/:slug` | Détail produit (par slug) |
| `/campaign/:id` | Campagne de dons |
| `/offering/:id` | Offrande |
| `/event/:id` | Événement |
| `/program/:id` | Programme de formation |
| `/announcement/:id` | Annonce |
| `/go/:code` | Redirection lien court/affilié |

## 15.4 Pages authentifiées (Mon espace)

| Route | Description |
|-------|-------------|
| `/auth` | Connexion / Inscription |
| `/welcome` | Intent post-inscription |
| `/dashboard` | Tableau de bord personnel |
| `/profile` | Profil |
| `/marketplace` | Marketplace (Le Hub) |
| `/feed` | Fil d'actualité |
| `/reels` | Contenu court |
| `/watch/:id` | Lecture vidéo |
| `/bookmarks` | Favoris |
| `/my-programs` | Mes formations |
| `/invoices` | Mes factures |
| `/my-donations` | Mes dons |
| `/my-analytics` | Mes statistiques |
| `/notifications` | Notifications |
| `/notification-preferences` | Préférences notifs |
| `/affiliation` | Mon espace ambassadeur |
| `/partner` | Portail partenaire |
| `/support` | Support |
| `/create-org` | Créer une organisation |
| `/quick-start` | Guide de démarrage rapide |

## 15.5 Admin Créateur (/admin/*)

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard admin |
| `/admin/products` | Gestion produits |
| `/admin/products/new` | Nouveau produit |
| `/admin/products/:id/edit` | Modifier produit |
| `/admin/campaigns` | Campagnes de dons |
| `/admin/offerings` | Offrandes |
| `/admin/programs` | Programmes de formation |
| `/admin/media` | Gestion médias |
| `/admin/photos` | Galerie photos |
| `/admin/announcements` | Annonces |
| `/admin/events` | Événements |
| `/admin/sales` | Ventes |
| `/admin/payouts` | Versements |
| `/admin/analytics` | Analytiques |
| `/admin/crm` | CRM / Contacts |
| `/admin/notifications` | Push & email |
| `/admin/affiliation` | Programme ambassadeur |
| `/admin/promo-codes` | Codes promo |
| `/admin/members` | Membres de l'org |
| `/admin/kyc` | Vérification d'identité |
| `/admin/settings` | Paramètres org |
| `/admin/subscriptions` | Abonnements |
| `/admin/waitlists` | Listes d'attente |
| `/admin/webhooks` | Webhooks |
| `/admin/experiments` | Tests A/B |

## 15.6 Superadmin (/superadmin/*)

| Route | Description |
|-------|-------------|
| `/superadmin` | Dashboard global |
| `/superadmin/orgs` | Organisations |
| `/superadmin/users` | Utilisateurs |
| `/superadmin/partners` | Partenaires |
| `/superadmin/transactions` | Transactions |
| `/superadmin/settlements` | Règlements |
| `/superadmin/kyc` | Vérification KYC |
| `/superadmin/risk` | Risque / AML |
| `/superadmin/activity` | Fil d'activité |
| `/superadmin/emails` | Logs email |
| `/superadmin/push` | Notifications push |
| `/superadmin/support` | Support |
| `/superadmin/exports` | Exports CSV |
| `/superadmin/metrics` | Métriques |
| `/superadmin/reports` | Rapports |
| `/superadmin/directory` | Annuaire |
| `/superadmin/investor` | Vue investisseur |
| `/superadmin/ai` | Chat IA |
| `/superadmin/settings` | Paramètres plateforme |

---

# 16. GLOSSAIRE

| Terme | Définition |
|-------|-----------|
| **Organisation** | Le "vendeur/créateur" — l'entité qui utilise Siteviral |
| **Le Hub** | La marketplace où tous les produits sont visibles |
| **Mon espace** | Le tableau de bord personnel de l'utilisateur |
| **Ambassadeur** | Utilisateur qui partage des liens et gagne des commissions |
| **Partenaire** | Apporteur d'affaires B2B qui recrute des organisations |
| **Gagner** | Section ambassadeur de la plateforme |
| **Ma plateforme / Centre Digital** | Section créateur/admin |
| **Split automatique** | Répartition automatique de l'argent entre acteurs |
| **Mobile Money (MoMo)** | Paiement par téléphone (Orange, MTN, Moov) |
| **Commission plateforme** | Les 10% que Siteviral prend sur chaque transaction |
| **Rétention** | Délai d'attente avant de pouvoir retirer l'argent |
| **KYC** | Know Your Customer — vérification d'identité avant retrait |
| **Paystack** | Processeur de paiement pour l'Afrique |
| **Stripe** | Processeur de paiement international |
| **PWA** | Progressive Web App — app installable depuis le navigateur |
| **Filigrane / Watermark** | Nom de l'acheteur inscrit sur les fichiers téléchargés |
| **RLS** | Row Level Security — isolation des données par organisation |
| **Edge Function** | Code serveur exécuté au plus proche de l'utilisateur |
| **Idempotence** | Garantie qu'un paiement n'est traité qu'une seule fois |
| **OG tags** | Meta-données pour le partage social (titre, image, description) |
| **Livre** | Contenu de 50+ pages |
| **Livret** | Contenu de moins de 50 pages |
| **GMV** | Gross Merchandise Volume — volume total des transactions |

---

# 17. FAQ INTERNE

### 💰 Finance

**Q: Comment Siteviral gagne de l'argent ?**
> Commission de 10% sur chaque transaction (vente de produit, don, offrande).

**Q: Où va l'argent collecté ?**
> Directement chez Paystack ou Stripe. Siteviral ne stocke pas d'argent. Les versements sont faits via les processeurs de paiement.

**Q: Un vendeur peut-il fixer le taux de commission ambassadeur ?**
> Oui, entre 5% et 50%. Le défaut est 10%.

**Q: Les dons ont-ils des commissions ambassadeur ?**
> Non, jamais. C'est une règle éthique non négociable.

**Q: Quel est le seuil de retrait ?**
> 5 000 XOF minimum pour les partenaires. Pas de seuil minimum explicite pour les vendeurs (géré au cas par cas).

### 🔧 Technique

**Q: Pourquoi une SPA et pas du SSR ?**
> Choix de stack (React + Vite). Le SEO est compensé par le Cloudflare Worker qui sert du HTML pré-rendu aux bots.

**Q: Pourquoi 3 tables de transactions séparées ?**
> `product_purchases`, `donations`, `offering_transactions` — chaque type a des champs spécifiques (ex: file_url pour les produits, campaign_id pour les dons). La logique de traitement est unifiée dans `process-transaction.ts`.

**Q: Comment fonctionne le lazy loading ?**
> Toutes les pages sont `React.lazy()` avec un `Suspense` global et un loader brandé. Seuls les layouts et le router sont chargés immédiatement.

**Q: Comment fonctionne la gamification ?**
> XP, badges, streaks — principalement côté frontend via `useGamification` et `useGamificationEngine`. Les badges sont stockés en base dans la table `badges`.

### 📱 Produit

**Q: Siteviral est-il disponible en anglais ?**
> L'interface est en français par défaut avec un système i18n prêt pour la traduction. Le contenu des organisations est dans la langue choisie par le créateur.

**Q: Peut-on avoir plusieurs organisations ?**
> Oui. Un utilisateur peut créer et gérer plusieurs organisations.

**Q: Les vidéos Facebook fonctionnent-elles dans l'éditeur ?**
> Facebook bloque l'intégration en iframe (restriction de leur côté). Un lien cliquable stylisé est inséré à la place. YouTube, TikTok, Vimeo, Dailymotion, Twitter/X et Instagram fonctionnent en iframe.

**Q: Comment les fichiers sont-ils protégés ?**
> Tous les téléchargements passent par la edge function `watermark-download` qui inscrit le nom de l'acheteur en filigrane sur le fichier.

---

# 📊 DIAGRAMME SYNTHÉTIQUE FINAL

```
                    ┌──────────────────┐
                    │   CLOUDFLARE     │
                    │   CDN + SEO      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   FRONTEND       │
                    │   React SPA      │
                    │   ~120 routes    │
                    │   ~45 hooks      │
                    │   PWA            │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼──────┐  ┌───▼────────┐
     │  Supabase  │  │   Edge      │  │  External  │
     │  Database  │  │  Functions  │  │  Services  │
     │  ~40+ tbl  │  │  ~38 fns    │  │            │
     │  + RLS     │  │             │  │  Stripe    │
     │  + FTS     │  │  payments   │  │  Paystack  │
     │  + Auth    │  │  emails     │  │  OneSignal │
     │  + Storage │  │  webhooks   │  │  Resend    │
     │            │  │  SEO/OG     │  │  Gemini AI │
     │            │  │  watermark  │  │  ipapi.co  │
     └────────────┘  └─────────────┘  └────────────┘
```

---

## 🎯 RÉSUMÉ EN 10 CHIFFRES

| Métrique | Valeur |
|----------|--------|
| Routes frontend | ~120 |
| Tables de base de données | ~40+ |
| Edge Functions | ~38 |
| Hooks personnalisés | ~45 |
| Pages persona SEO | ~30 |
| Articles de blog | ~140 |
| Guides SEO | 9 |
| Pages légales | 12 |
| Processeurs de paiement | 2 (Stripe + Paystack) |
| Commission plateforme | 10% |

---

*Document généré le 5 mars 2026 — Présentation complète Siteviral v2.0*
*Usage interne — Équipes techniques et non techniques*
