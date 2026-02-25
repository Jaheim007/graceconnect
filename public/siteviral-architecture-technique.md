# SITEVIRAL — Document d'Architecture Technique
## Version 1.0 — Février 2026
### Document confidentiel — Usage interne et audit

---

## Table des matières

1. [Vue d'ensemble du système](#1-vue-densemble-du-système)
2. [Architecture applicative](#2-architecture-applicative)
3. [Base de données (schéma complet)](#3-base-de-données)
4. [Rôles & Autorisations](#4-rôles--autorisations)
5. [Architecture financière détaillée](#5-architecture-financière-détaillée)
6. [Module Affiliés (Programme Ambassadeur)](#6-module-affiliés-programme-ambassadeur)
7. [Programme Partenaires](#7-programme-partenaires)
8. [Sécurité](#8-sécurité)
9. [Compliance & Risques](#9-compliance--risques)
10. [Monitoring & Observabilité](#10-monitoring--observabilité)
11. [Scalabilité](#11-scalabilité)
12. [Diagrammes finaux](#12-diagrammes-finaux)
13. [Confirmations de sécurité](#13-confirmations-de-sécurité)

---

## 1. Vue d'ensemble du système

### 1.1 Description globale

Siteviral est une plateforme SaaS multi-tenant permettant à des organisations (églises, ONG, leaders communautaires, etc.) de créer leur présence digitale complète : contenu média, événements, produits numériques, collecte de dons, et programmes de fidélisation — avec monétisation intégrée.

### 1.2 Positionnement

**Siteviral est un fournisseur d'infrastructure digitale SaaS, PAS un établissement financier, fintech, ou PSP (Payment Service Provider).**

La plateforme agit comme facilitateur technique utilisant des processeurs de paiement tiers licenciés (Paystack, Stripe). Les organisations restent les Merchant of Record pour leurs transactions.

### 1.3 Architecture high-level

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTS (Navigateurs)                     │
│  React SPA (Vite + TypeScript + TailwindCSS)                     │
│  PWA installable — Service Worker — Offline support              │
└───────────────┬──────────────────────────────────┬───────────────┘
                │ HTTPS                            │ HTTPS
                ▼                                  ▼
┌──────────────────────────┐      ┌────────────────────────────────┐
│     SUPABASE PLATFORM    │      │     PAYMENT PROCESSORS          │
│                          │      │                                  │
│  ┌─────────────────────┐ │      │  ┌──────────┐  ┌─────────────┐ │
│  │   Auth (GoTrue)     │ │      │  │ PAYSTACK  │  │   STRIPE    │ │
│  │   Google OAuth      │ │      │  │ Afrique   │  │   Global    │ │
│  │   Magic Link / OTP  │ │      │  │ MoMo+Card │  │   Cards     │ │
│  └─────────────────────┘ │      │  └─────┬─────┘  └──────┬──────┘ │
│                          │      │        │               │        │
│  ┌─────────────────────┐ │      │   Webhooks          Webhooks   │
│  │   PostgreSQL DB     │ │      └────────┼───────────────┼────────┘
│  │   RLS enforced      │ │               │               │
│  │   60+ tables        │ │               ▼               ▼
│  └─────────────────────┘ │      ┌────────────────────────────────┐
│                          │      │     EDGE FUNCTIONS (Deno)       │
│  ┌─────────────────────┐ │      │                                  │
│  │   Storage Buckets   │ │      │  verify-payment                 │
│  │   4 buckets         │ │      │  paystack-webhook               │
│  │   Signed URLs       │ │      │  stripe-create-checkout         │
│  └─────────────────────┘ │      │  stripe-webhook                 │
│                          │      │  stripe-verify                  │
│  ┌─────────────────────┐ │      │  process-payout                 │
│  │ Edge Functions x29  │ │      │  request-affiliate-payout       │
│  │ Deno runtime        │ │      │  request-partner-payout         │
│  │ Auto-deploy         │ │      │  process-partner-payout         │
│  └─────────────────────┘ │      │  release-settlement             │
│                          │      │  send-email (Resend)            │
│  ┌─────────────────────┐ │      │  send-push (OneSignal)          │
│  │  Realtime           │ │      │  + 18 autres                    │
│  │  Subscriptions      │ │      └────────────────────────────────┘
│  └─────────────────────┘ │
└──────────────────────────┘

       ┌───────────────────────────────┐
       │     SERVICES TIERS            │
       │  Resend (Email transactionnel)│
       │  OneSignal (Push notifs)      │
       │  Sentry (Error tracking)      │
       └───────────────────────────────┘
```

### 1.4 Composants principaux

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS | SPA avec PWA, lazy loading, code splitting |
| Auth | Supabase Auth (GoTrue) | Google OAuth, Magic Link, OTP email |
| Database | PostgreSQL (Supabase hosted) | 60+ tables, RLS enforced, 20+ DB functions |
| Edge Functions | Deno (Supabase Edge Functions) | 29 fonctions serverless pour logique métier |
| Storage | Supabase Storage | 4 buckets (2 publics, 2 privés) |
| PSP Afrique | Paystack | MoMo, cartes locales, subaccounts, transfers |
| PSP Global | Stripe | Cartes internationales, Checkout Sessions |
| Email | Resend | Emails transactionnels (8+ templates) |
| Push | OneSignal | Notifications push web/mobile |
| Monitoring | Sentry | Error tracking frontend |

---

## 2. Architecture applicative

### 2.1 Frontend

**Stack :**
- React 18.3 avec lazy loading (40+ pages lazy-loaded)
- Vite 5+ pour le bundling
- TypeScript strict
- TailwindCSS + shadcn/ui (80+ composants UI)
- Framer Motion pour les animations
- TanStack React Query pour le cache et la synchronisation
- React Router v6 pour le routing

**Routing (séparation des interfaces) :**

| Interface | Préfixe | Guard | Exemples |
|-----------|---------|-------|----------|
| Public | `/`, `/org/:slug`, `/discover` | Aucun | Landing, pages org, marketplace |
| Authentifié | `/feed`, `/dashboard`, `/profile` | `RequireAuth` | Feed, dashboard, profil |
| Admin Org | `/admin/*` | `RequireOrgManage` | Gestion contenu, analytics, payouts |
| Superadmin | `/superadmin/*` | `RequireSuperadmin` | Users, KYC, transactions, settlements |
| Partenaire | `/partner` | `RequireAuth` | Portail partenaire |
| Légal | `/terms`, `/privacy`, etc. | Aucun | 13 pages légales |

**Gestion auth :**
- `AuthContext` wraps toute l'app
- `getSession()` au montage + `onAuthStateChange` listener
- Profile auto-upsert à la première connexion
- Rôle plateforme vérifié via `user_platform_roles`
- Timeout de sécurité de 5s si Supabase ne répond pas

**Gestion rôles :**
- Rôles stockés dans des tables séparées (JAMAIS dans profiles ou auth.users)
- `user_platform_roles` : rôles globaux (superadmin)
- `organization_members` : rôles par org (owner, admin, editor, member, affiliate)
- Vérification côté client ET côté serveur (double validation)

### 2.2 Backend logique — Répartition

| Couche | Responsabilité | Exemples |
|--------|----------------|----------|
| Client (React) | UI, navigation, cache, appels API, validations basiques | Formulaires, filtres, pagination |
| Edge Functions (Deno) | Logique métier critique, intégrations PSP, emails, sécurité | Vérification paiements, payouts, webhooks |
| RPC PostgreSQL | Opérations atomiques nécessitant SECURITY DEFINER | Création org+owner, attribution partenaire, KYC review |
| RLS Policies | Contrôle d'accès données en temps réel | Isolation multi-tenant, permissions lecture/écriture |
| DB Triggers | Génération automatique (slugs, codes référence) | `generate_product_slug`, `generate_referral_code` |

### 2.3 Edge Functions — Inventaire complet

| Fonction | JWT requis | Rôle |
|----------|-----------|------|
| `verify-payment` | Non (mais auth optionnelle) | Vérification Paystack + enregistrement transaction |
| `paystack-webhook` | Non (HMAC signature) | Réception webhooks Paystack |
| `stripe-create-checkout` | Non (auth optionnelle) | Création session Stripe Checkout |
| `stripe-webhook` | Non (Stripe signature) | Réception webhooks Stripe |
| `stripe-verify` | Non | Polling vérification Stripe |
| `process-payout` | Oui (superadmin) | Approbation/rejet payouts affiliés + orgs |
| `request-affiliate-payout` | Oui (JWT + membership) | Demande de payout ambassadeur |
| `request-partner-payout` | Oui (JWT + ownership) | Demande de payout partenaire |
| `process-partner-payout` | Oui (superadmin) | Traitement payout partenaire |
| `release-settlement` | Oui (superadmin/cron) | Libération settlements après 72h |
| `create-paystack-subaccount` | Non | Création subaccount Paystack |
| `create-transfer-recipient` | Non | Création recipient Paystack (affilié) |
| `create-transfer-recipient-partner` | Non | Création recipient Paystack (partenaire) |
| `check-payout-capabilities` | Non | Vérification capabilities régionales |
| `settle-pre-subaccount` | Non | Migration fonds pré-subaccount |
| `migrate-subaccounts` | Non | Migration batch subaccounts |
| `claim-free-product` | Non | Réclamation produits gratuits |
| `send-email` | Non | Envoi emails via Resend |
| `send-campaign` | Non | Envoi campagnes email |
| `automated-emails` | Non | Emails automatisés (relances, etc.) |
| `send-push` | Non | Push notifications via OneSignal |
| `onesignal-test-push` | Non | Test push notifications |
| `aggregate-metrics` | Non | Agrégation métriques quotidiennes |
| `generate-signed-url` | Non | Génération URLs signées storage |
| `watermark-download` | Non | Téléchargement avec watermark |
| `superadmin-ai-chat` | Non | Chat IA pour superadmin |

---

## 3. Base de données

### 3.1 Tables principales et relations

#### 3.1.1 Gestion utilisateurs

**`profiles`**
- Objectif : Informations publiques des utilisateurs
- Champs clés : `id` (= auth.users.id), `display_name`, `avatar_url`, `bio`, `phone`, `country`
- RLS : Lecture publique, écriture par le propriétaire uniquement
- Note : PAS de rôles stockés ici (sécurité)

**`user_platform_roles`**
- Objectif : Rôles globaux de la plateforme
- Champs clés : `user_id`, `role` (enum: superadmin, user)
- Contrainte : UNIQUE(user_id, role)
- RLS : Lecture par l'utilisateur concerné, écriture superadmin uniquement
- Fonction helper : `is_superadmin(uuid)` SECURITY DEFINER

**`payout_profiles`**
- Objectif : Informations bancaires/MoMo isolées (sécurité renforcée)
- Champs clés : `user_id`, `paystack_recipient_code`, `bank_name`, `account_number`, `recipient_locked`
- RLS : Strictement limité au propriétaire
- Note : Séparé de `profiles` pour isolation des données financières sensibles

#### 3.1.2 Organisations (multi-tenant)

**`organizations`**
- Objectif : Entité principale multi-tenant
- Champs clés : `id`, `name`, `slug`, `owner_id`, `category` (enum), `plan_type` (enum), `country`, `currency`, `is_active`, `is_verified`, `kyc_status`, `monetization_enabled`, `affiliation_enabled`, `affiliation_commission_percent`, `platform_fee_percent`, `paystack_subaccount_code`, `payouts_frozen`, `payout_freeze_reason`
- Index : `slug` (unique), `owner_id`
- RLS : Lecture publique si `is_active`, gestion par owner/admin

**`organization_members`**
- Objectif : Membership multi-rôle par organisation
- Champs clés : `organization_id`, `user_id`, `role` (enum: owner, admin, editor, member, affiliate)
- Contrainte : UNIQUE(organization_id, user_id)
- Trigger : `prevent_owner_role_change` — empêche la modification du rôle owner
- Fonctions helpers : `get_org_role()`, `is_org_member()`, `can_manage_org()`, `can_admin_org()`

#### 3.1.3 Contenu

**`media_content`** — Vidéos, audios, reels, replays
- Champs clés : `organization_id`, `media_type` (enum), `media_url`, `is_premium`, `is_published`, `view_count`, `like_count`
- FTS : `fts_vector` pour recherche full-text
- Relations : `media_likes`, `media_saves`

**`announcements`** — Annonces organisationnelles
**`events`** — Événements avec FTS
**`digital_products`** — Produits numériques avec slugs auto-générés
- FTS : `fts_vector` pour recherche
- Champs vente : `price`, `sale_price`, `sale_ends_at`, `sales_count`
- Bundles : `is_bundle`, relation `bundle_items`
- Upsells : `order_bump_product_id`, `upsell_product_ids`
- Avis : `average_rating`, `review_count`

**`org_photos`** — Galerie photos



#### 3.1.4 Transactions financières

**`donations`**
- Objectif : Enregistrement des dons (Paystack + Stripe)
- Champs clés : `organization_id`, `campaign_id`, `user_id`, `amount`, `currency`, `paystack_reference` (utilisé aussi pour Stripe), `status` (enum: pending, completed, failed, refunded), `platform_fee`, `affiliate_commission`, `organization_amount`, `settlement_status` (held, released, frozen, disputed), `promo_code_id`, `dispute_status`, `dispute_id`
- RLS : Lecture par l'org owner/admin, l'utilisateur donateur

**`product_purchases`**
- Objectif : Enregistrement des achats de produits
- Structure identique aux donations + `product_id`, `discount_amount`

**`donation_campaigns`**
- Objectif : Campagnes de collecte avec objectifs
- Champs clés : `goal_amount`, `current_amount`, `is_active`, `end_date`

**`payment_events`**
- Objectif : Idempotency des webhooks
- Champs clés : `event_id` (unique), `provider`, `reference`, `payload` (JSON), `status` (received, processed, skipped)
- Note : Empêche le double-traitement des webhooks Paystack

#### 3.1.5 Affiliés (Programme Ambassadeur)

**`affiliate_links`**
- Objectif : Liens de parrainage par utilisateur/org
- Champs clés : `user_id`, `organization_id`, `code` (unique par org), `link_type`, `product_id`, `campaign_id`, `clicks`, `conversions`, `total_earned`, `is_active`, `is_frozen`, `freeze_reason`

**`affiliate_sales`**
- Objectif : Commissions individuelles
- Champs clés : `affiliate_link_id`, `affiliate_user_id`, `organization_id`, `transaction_type`, `transaction_id`, `gross_amount`, `commission_amount`, `commission_percent`, `status` (pending → payable → paid), `payable_at`

**`affiliate_attributions`**
- Objectif : Tracking first-party cookie pour attribution last-click
- Champs clés : `cookie_id`, `affiliate_link_id`, `user_id`, `expires_at` (7 jours), `converted`

#### 3.1.6 Partenaires (Programme Partner Network)

**`partners`**
- Objectif : Profil partenaire B2B
- Champs clés : `user_id`, `full_name`, `invite_code`, `status` (pending, approved, suspended, rejected), `level`, `custom_rate_override`, `min_payout_threshold`, `kyc_status`, `paystack_recipient_code`, `id_document_url`

**`partner_referrals`**
- Objectif : Attribution org → partenaire (lock après 24h/première transaction)
- Champs clés : `partner_id`, `organization_id`, `status` (pending, active)

**`partner_commissions`**
- Objectif : Commissions calculées sur platform_fee uniquement
- Champs clés : `partner_id`, `organization_id`, `payment_reference`, `platform_fee_amount`, `commission_percent`, `commission_amount`, `status` (held → payable → paid), `payable_at`

**`partner_payout_requests`**
- Objectif : Demandes de retrait partenaire
- Champs clés : `partner_id`, `amount`, `currency`, `status`, `commission_ids[]`

#### 3.1.7 Payouts

**`payout_requests`**
- Objectif : Demandes de retrait (affiliés + orgs)
- Champs clés : `organization_id`, `user_id`, `payout_type` (affiliate, org), `amount`, `currency`, `status` (requested, approved, paid, rejected), `metadata` (JSON avec sale_ids)

**`kyc_submissions`**
- Objectif : Soumissions KYC par organisation
- Champs clés : `organization_id`, `kyc_level`, `id_document_url`, `bank_account_name`, `bank_account_number`, `bank_name`, `paystack_recipient_code`, `status`

#### 3.1.8 Sécurité & Audit

**`audit_logs`**
- Objectif : Piste d'audit complète
- Champs clés : `user_id`, `organization_id`, `action`, `resource_type`, `resource_id`, `metadata` (JSON), `ip_address`

**`fraud_flags`**
- Objectif : Signalements de fraude automatiques
- Champs clés : `user_id`, `organization_id`, `reason`, `metadata`, `resolved`

**`content_reports`**
- Objectif : Signalements de contenu par les utilisateurs

**`platform_alerts`**
- Objectif : Alertes infrastructure en temps réel
- Champs clés : `alert_type`, `severity` (info, warning, critical), `title`, `details`

#### 3.1.9 Engagement & CRM

**`user_notifications`** — Notifications in-app
**`push_subscriptions`** — Abonnements push OneSignal
**`notification_preferences`** — Préférences notification par utilisateur
**`contacts`** — CRM contacts par org
**`email_campaigns`** — Campagnes email
**`email_logs`** — Logs emails envoyés
**`client_events`** — Analytics client-side
**`org_daily_metrics`** — Métriques agrégées quotidiennes
**`badges`** / `user_referrals` — Gamification
**`watch_history`** — Historique de visionnage
**`content_versions`** — Versioning contenu
**`abandoned_carts`** — Paniers abandonnés

#### 3.1.10 Configuration

**`org_page_settings`** — Personnalisation page org (couleurs, pixels, popups)
**`promo_codes`** — Codes promo par org/produit
**`download_logs`** — Logs téléchargements produits
**`directory_applications`** — Candidatures annuaire

---

## 4. Rôles & Autorisations

### 4.1 Hiérarchie des rôles

```
┌─────────────────────────────────────────┐
│              SUPERADMIN                  │
│  (table: user_platform_roles)           │
│  Accès total plateforme                 │
├─────────────────────────────────────────┤
│         ORG OWNER                        │
│  (table: organization_members)          │
│  Contrôle total de l'organisation       │
├─────────────────────────────────────────┤
│         ORG ADMIN                        │
│  Gestion contenu + membres + analytics  │
├─────────────────────────────────────────┤
│         ORG EDITOR                       │
│  Gestion contenu uniquement             │
├─────────────────────────────────────────┤
│     MEMBER / AFFILIATE                   │
│  Accès lecture + lien affilié           │
├─────────────────────────────────────────┤
│       PARTNER (table: partners)          │
│  Système séparé — portail dédié         │
├─────────────────────────────────────────┤
│         USER (authentifié)               │
│  Feed, achats, dons, profil             │
├─────────────────────────────────────────┤
│       ANONYMOUS (non authentifié)        │
│  Lecture contenu public uniquement      │
└─────────────────────────────────────────┘
```

### 4.2 Matrice d'accès

| Ressource | Anonymous | User | Member | Editor | Admin | Owner | Superadmin |
|-----------|-----------|------|--------|--------|-------|-------|------------|
| Contenu public org | ✅ Lecture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contenu premium | ❌ | ✅ (si membre) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer contenu | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gérer membres | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Analytics org | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Payouts org | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Supprimer org | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| KYC management | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Voir toutes les orgs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approuver payouts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Gérer partenaires | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 4.3 Fonctions helper (SECURITY DEFINER)

```sql
is_superadmin(uuid) → boolean          -- Vérifie rôle global
get_org_role(uuid, uuid) → enum        -- Rôle dans une org
is_org_member(uuid, uuid) → boolean    -- Membership
can_manage_org(uuid, uuid) → boolean   -- owner/admin/editor
can_admin_org(uuid, uuid) → boolean    -- owner/admin only
is_partner_owner(uuid) → boolean       -- Propriété partenaire
```

### 4.4 Protection JWT dans les Edge Functions

| Fonction | Validation JWT | Rôle requis |
|----------|---------------|-------------|
| `process-payout` | ✅ Obligatoire | superadmin |
| `process-partner-payout` | ✅ Obligatoire | superadmin |
| `request-affiliate-payout` | ✅ Obligatoire | user (+ membership check) |
| `request-partner-payout` | ✅ Obligatoire | partner owner |
| `release-settlement` | ✅ Obligatoire | superadmin / cron |
| `verify-payment` | ⚠️ Optionnel | Aucun (résolution user_id si présent) |
| `paystack-webhook` | ❌ (HMAC signature) | N/A (Paystack servers) |
| `stripe-webhook` | ❌ (Stripe signature) | N/A (Stripe servers) |
| `stripe-create-checkout` | ⚠️ Optionnel | Aucun |

### 4.5 Utilisation de `service_role_key`

La clé `SUPABASE_SERVICE_ROLE_KEY` est utilisée EXCLUSIVEMENT dans les Edge Functions pour :
- Bypass des RLS policies lors d'opérations administratives
- Lecture/écriture cross-tenant dans les webhooks
- Opérations financières atomiques (payout, settlement)
- Envoi de notifications à des utilisateurs tiers

Elle n'est JAMAIS exposée côté client. Le client utilise uniquement `SUPABASE_ANON_KEY`.

---

## 5. Architecture financière détaillée

### 5.1 Flux Paystack

#### 5.1.1 Modèle Subaccount + Split

```
Acheteur paie 10 000 XOF
        │
        ▼
┌──────────────────────┐
│     PAYSTACK          │
│                       │
│  Split automatique :  │
│  ├─ Vendeur (subaccount) : 9 000 XOF (90%)
│  │   settlement_schedule: manual
│  └─ Siteviral (transaction_charge) : 1 000 XOF (10%)
│      └─ platform_fee: 1 000 XOF
│         ├─ affiliate_commission: 100 XOF (si applicable, pris sur le montant total)
│         └─ partner_commission: 50 XOF (calculé sur platform_fee)
└──────────────────────┘
```

**Subaccount par organisation :**
- Créé via Edge Function `create-paystack-subaccount`
- `settlement_schedule: 'manual'` pour contrôle plateforme
- Permet à l'org d'être le Merchant of Record légal
- Paramétré avec `percentage_charge` = `platform_fee_percent` (défaut 10%)

**Split via `transaction_charge` :**
- La plateforme collecte sa part dans le solde principal
- Le reste va directement au subaccount de l'org
- Pas de mouvement de fonds supplémentaire nécessaire pour l'org

#### 5.1.2 Vérification de paiement

**Double vérification (Belt & Suspenders) :**

1. **Frontend polling** (`verify-payment`) :
   - Appelé par le frontend après fermeture du popup Paystack
   - Re-vérifie via l'API Paystack : `GET /transaction/verify/{reference}`
   - Crée/met à jour l'enregistrement dans `donations` ou `product_purchases`
   - Calcule les fees, commissions, et attribution affilié

2. **Webhook** (`paystack-webhook`) :
   - Réception événement `charge.success` avec HMAC SHA-512
   - Idempotent via table `payment_events` (event_id unique)
   - Traite les enregistrements manqués (si verify-payment n'a pas été appelé)
   - Gère aussi : `charge.dispute.*`, `transfer.success/failed/reversed`

#### 5.1.3 Idempotency

```
Webhook reçu avec event_id X
    │
    ├─ payment_events.event_id = X existe et status = 'processed' ?
    │   └─ OUI → Retour 200 {idempotent: true}, aucune action
    │
    ├─ donations/product_purchases.paystack_reference = ref existe et status = 'completed' ?
    │   └─ OUI → Vérifier affiliate_sales complète → Retour 200
    │
    └─ NON → Traitement complet → Insert/Update → Mark 'processed'
```

#### 5.1.4 Settlement & Hold

| Type | Période de rétention | Logique |
|------|---------------------|---------|
| Vendeur (org) | 72 heures | `settlement_status: 'held'` → `'released'` via `release-settlement` |
| Affilié | 15 jours | `payable_at = now() + 15d` dans `affiliate_sales` |
| Partenaire | 15 jours | `payable_at = now() + 15d` dans `partner_commissions` |

**release-settlement** :
- Exécutable par superadmin ou cron
- Trouve les transactions `held` + `completed_at < 72h ago` + `dispute_status IS NULL`
- Met à jour `settlement_status → 'released'`
- Les transactions `disputed` restent bloquées
- Les orgs avec `payouts_frozen = true` sont marquées `'frozen'`

#### 5.1.5 Payout vendeur (org)

```
1. Org owner → demande payout (via UI admin)
2. payout_requests INSERT (type: 'org', status: 'requested')
3. Superadmin → approve via process-payout
4. Vérification fonds released suffisants
5. Paystack: subaccount settlement_schedule → 'auto' (release)
6. Immédiatement après : revert → 'manual'
7. payout_requests → 'paid'
```

#### 5.1.6 Payout affilié

```
1. Affilié → request-affiliate-payout (JWT obligatoire)
2. Vérifie : KYC org approuvé, org non gelée
3. Agrège affiliate_sales avec payable_at < now() et status = 'pending'
4. Transition status → 'payable'
5. Crée payout_request (type: 'affiliate')
6. Superadmin → approve via process-payout
7. Balance check Paystack (solde principal)
8. Si insuffisant → alerte platform_alerts + rejet
9. Transfer API : source='balance', recipient=paystack_recipient_code
10. Si succès → affiliate_sales → 'paid', recipient_locked = true
11. Si échec → audit_log, pas de changement de status
```

#### 5.1.7 Payout partenaire

```
1. Partenaire → request-partner-payout (JWT + ownership check)
2. Vérifie : partner.status = 'approved', recipient_code configuré
3. Transition partner_commissions : 'held' → 'payable' (si payable_at < now)
4. Agrège commissions payables
5. Vérifie seuil minimum (min_payout_threshold)
6. Crée partner_payout_request
7. Superadmin → approve via process-partner-payout
8. Re-vérifie commissions encore payables (pas de refund entre-temps)
9. Balance check Paystack
10. Transfer API vers partner.paystack_recipient_code
11. Si succès → commissions → 'paid', payout → 'paid'
12. Si échec → payout → 'failed', audit_log
```

### 5.2 Stripe (intégré)

#### 5.2.1 Type d'intégration

**Stripe Checkout (mode payment)** — pas de Stripe Connect actuellement.

L'intégration Stripe est utilisée pour les **encaissements internationaux par carte bancaire**. Les fonds arrivent sur le compte Stripe principal de Siteviral (entité US).

#### 5.2.2 Flux Stripe

```
1. Acheteur choisit "Carte bancaire" dans PaymentMethodSelector
2. Frontend → callFn('stripe-create-checkout', {...})
3. Edge Function crée une Stripe Checkout Session :
   - mode: 'payment'
   - line_items avec price_data dynamique
   - metadata : sv_reference, type, org_id, affiliate_code, etc.
   - payment_intent_data.metadata (même metadata)
4. Retour checkout_url → redirect navigateur
5. Stripe Checkout page → paiement → redirect success_url?reference=SV-STRIPE-xxx&gateway=stripe

Post-paiement (2 chemins parallèles) :
   A. Frontend polling : stripe-verify → vérifie session Stripe → retour OK
   B. Webhook : stripe-webhook → checkout.session.completed
      - Vérifie signature HMAC-SHA256
      - Récupère metadata du PaymentIntent
      - Même logique que verify-payment : fees, affiliés, partenaires, notifications
      - Insert dans donations/product_purchases avec paystack_reference = sv_reference
```

#### 5.2.3 Vérification de signature Stripe

```typescript
// Implémentation manuelle HMAC-SHA256 (pas de SDK Stripe)
const signedPayload = `${timestamp}.${rawBody}`;
const key = await crypto.subtle.importKey('raw', secret, {name:'HMAC', hash:'SHA-256'}, ...);
const sig = await crypto.subtle.sign('HMAC', key, signedPayload);
// Compare hex(sig) avec la signature v1 du header stripe-signature
// Tolérance timestamp : 5 minutes
```

#### 5.2.4 Gestion multi-devises

```typescript
const zeroDecimalCurrencies = ['XOF','XAF','BIF','CLP','DJF','GNF','JPY',...];
const stripeAmount = isZeroDecimal ? amount : amount * 100;
```

### 5.3 Abstraction Provider (Payment Gateway)

#### 5.3.1 Routage hybride

```
┌─────────────────────────────────────┐
│         PaymentMethodSelector        │
│                                      │
│  📱 Mobile Money    💳 Carte bancaire│
│  (Paystack)         (Stripe)         │
│                                      │
│  Auto-suggestion par pays :          │
│  CI,GH,NG,KE,ZA,EG,RW → Paystack   │
│  Reste du monde → Stripe             │
│  Override manuel toujours possible   │
└──────────┬──────────────┬────────────┘
           │              │
           ▼              ▼
┌─────────────────┐ ┌─────────────────┐
│usePaymentGateway│ │usePaymentGateway│
│                 │ │                 │
│ method='mobile_ │ │ method='card'   │
│ money'          │ │                 │
│                 │ │                 │
│ → usePaystack   │ │ → callFn(       │
│   (inline popup)│ │   'stripe-      │
│                 │ │   create-       │
│ onSuccess(ref,  │ │   checkout')    │
│  'paystack')    │ │ → redirect to   │
│                 │ │   Stripe hosted │
└─────────────────┘ └─────────────────┘
```

#### 5.3.2 Isolation des balances

| Balance | Localisation | Usage |
|---------|-------------|-------|
| Paystack Main Balance | Compte Paystack Siteviral | Platform fees + affiliate/partner payouts |
| Paystack Subaccounts | Comptes individuels par org | Fonds vendeur (settlement manual) |
| Stripe Balance | Compte Stripe Siteviral (US) | Encaissements cartes internationales |

**Règle critique : JAMAIS de cross-provider payout.**
- Fonds Paystack → payout via Paystack Transfer API uniquement
- Fonds Stripe → payout via dashboard Stripe ou Stripe Connect (futur)
- Pas de transfert Stripe → Paystack ni inverse

#### 5.3.3 Références transactionnelles

| Provider | Format référence | Exemple |
|----------|------------------|---------|
| Paystack | `SV-{timestamp}-{random}` | `SV-1708901234567-A1B2C3D4E` |
| Stripe | `SV-STRIPE-{timestamp}-{random}` | `SV-STRIPE-1708901234567-F5G6H7I8J` |

Les deux utilisent le champ `paystack_reference` dans les tables `donations` et `product_purchases` (nom historique maintenu pour compatibilité).

---

## 6. Module Affiliés (Programme Ambassadeur)

### 6.1 Attribution

- **Modèle** : Last-click avec fenêtre de 7 jours
- **Mécanisme** : Cookie first-party + localStorage fallback
- **Table** : `affiliate_attributions` (cookie_id, affiliate_link_id, expires_at)
- **Résolution** : Côté serveur lors de la vérification de paiement
- **Self-enroll** : Via `self_enroll_affiliate()` RPC — auto-inscription instantanée

### 6.2 Calcul de commission

```
Commission = amount_paid × affiliation_commission_percent / 100
(défaut : 10%, configurable par org)
```

- Calculée sur le montant total payé par l'acheteur
- Déduite APRÈS le platform_fee pour calculer `organization_amount`
- `organization_amount = amount - platform_fee - affiliate_commission`

### 6.3 Exclusion stricte des dons

```typescript
// verify-payment & paystack-webhook & stripe-webhook
if (affiliate_code && org.affiliation_enabled && type === 'product') {
  // Commission calculée UNIQUEMENT pour les produits
}
// type === 'donation' → JAMAIS de commission affilié
```

### 6.4 Période de rétention (`payable_at`)

- 15 jours après la transaction
- `payable_at = now() + 15 * 24 * 60 * 60 * 1000`
- Vérifié dans `process-payout` : toutes les sales doivent avoir `payable_at < now()`
- Les sales immatures sont rejetées avec le message d'erreur incluant la date

### 6.5 Freeze (gel)

- `affiliate_links.is_frozen` : gel d'un lien spécifique
- `affiliate_links.freeze_reason` : motif du gel
- `organizations.payouts_frozen` : gel global des payouts d'une org
- Vérifié dans `request-affiliate-payout`

### 6.6 Anti-fraude

| Contrôle | Implémentation |
|----------|----------------|
| Self-referral | `affLink.user_id !== userId` dans verify-payment |
| Device fingerprint | `buyer_ip`, `device_hash` dans donations/purchases |
| Duplicate detection | Idempotency sur `paystack_reference` unique |
| Cookie manipulation | Validation serveur de l'attribution |
| Owner as affiliate | `self_enroll_affiliate` bloque si `org.owner_id === caller` |
| Fraud flags | Table `fraud_flags` avec signalements automatiques |

### 6.7 Payout via recipient_code

- Informations bancaires/MoMo dans `payout_profiles` (table isolée)
- `paystack_recipient_code` généré via `create-transfer-recipient`
- Supports : Bank transfer, Mobile Money (Orange, MTN, Moov CI)
- Verrouillage après premier payout réussi : `recipient_locked = true`
- Capabilities check via `check-payout-capabilities` avant affichage des options

---

## 7. Programme Partenaires

### 7.1 Architecture (séparation totale)

```
┌─────────────────────────────────────────────────────────────────┐
│                        AFFILIÉ ≠ PARTENAIRE                     │
│                                                                  │
│  AFFILIÉ (Ambassadeur)          │  PARTENAIRE (Partner Network)  │
│  ─────────────────────          │  ────────────────────────────  │
│  Table: affiliate_links         │  Table: partners               │
│  Table: affiliate_sales         │  Table: partner_commissions    │
│  Table: payout_requests         │  Table: partner_payout_requests│
│                                 │  Table: partner_referrals      │
│  Commission sur: PRODUITS       │  Commission sur: PLATFORM FEE  │
│  Assiette: montant total        │  Assiette: frais plateforme    │
│  Bénéficiaire: utilisateur      │  Bénéficiaire: partenaire B2B  │
│  Payout: payout_profiles        │  Payout: partners.recipient    │
│  Lien: code ambassadeur         │  Lien: invite_code partenaire  │
│                                 │                                │
│  AUCUNE TABLE PARTAGÉE          │  AUCUN CALCUL CROISÉ           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Calcul commission partenaire

```
partner_commission = platform_fee × effective_rate / 100

Où effective_rate = custom_rate_override ?? level_based_rate

Niveaux :
  Level 1 (Bronze, 10+ orgs)  : 5%
  Level 2 (Silver, 50+ orgs)  : 8%
  Level 3 (Gold, 150+ orgs)   : 10%
  Level 4 (Platinum, 300+ orgs): 12%
  Level 5 (Diamond, 1000+ orgs): 15%
```

**Exclusion dons :** Commissions partenaire calculées uniquement sur les ventes produits (`type === 'product'`), jamais sur les dons.

### 7.3 Lock attribution

- Attribution via `attribute_org_to_partner()` RPC
- Vérifications : code valide, partenaire approuvé, pas de self-referral, pas de double attribution
- Lock définitif : une fois attribuée, une org ne change pas de partenaire (sauf transfert superadmin via `transfer_partner_referral()`)

### 7.4 Anti-MLM

- **Strictement single-level** : un partenaire gagne sur les orgs qu'il a directement référées
- Pas de commissions en cascade
- Pas de « sous-partenaires »
- `partner_commissions` n'a aucune relation vers d'autres partenaires
- Contrat de 13 articles (/partner-terms) formalisant cette règle

---

## 8. Sécurité

### 8.1 Row Level Security (RLS)

Toutes les tables ont RLS activé. Les policies utilisent les fonctions SECURITY DEFINER pour éviter les récursions :

```sql
-- Pattern type pour une table org-scoped
CREATE POLICY "Users can read own org data"
  ON public.some_table FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage"
  ON public.some_table FOR ALL
  USING (public.can_manage_org(auth.uid(), organization_id));
```

### 8.2 Storage privé + Signed URLs

| Bucket | Public | Usage | Protection |
|--------|--------|-------|------------|
| `public-assets` | ✅ | Logos, bannières, médias publics | Aucune restriction lecture |
| `user-avatars` | ✅ | Photos de profil | Upload limité au propriétaire |
| `private-products` | ❌ | Fichiers produits numériques | Signed URLs via `generate-signed-url` |
| `org-uploads` | ❌ | Documents KYC, fichiers privés | RLS strict (owner/superadmin) |

### 8.3 HMAC Paystack Webhook

```typescript
const hash = createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
if (hash !== req.headers.get('x-paystack-signature')) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 8.4 HMAC Stripe Webhook

```typescript
// Vérification manuelle SHA-256 (pas de SDK)
const signedPayload = `${timestamp}.${rawBody}`;
// crypto.subtle.importKey + sign + compare hex
// Tolérance temporelle : 300 secondes (5 minutes)
```

### 8.5 Rate Limiting

| Fonction | Limite | Fenêtre |
|----------|--------|---------|
| `verify-payment` | 20 req | 60s par IP |
| `process-payout` | 10 req | 60s par IP |
| `request-partner-payout` | 3 req | 60s par IP |
| `paystack-webhook` | 60 req | 60s par IP |

### 8.6 Idempotency

| Mécanisme | Table/Champ | Protection |
|-----------|-------------|------------|
| Webhook Paystack | `payment_events.event_id` unique | Double-traitement événement |
| Transaction | `donations.paystack_reference` unique | Double-paiement |
| Commission affilié | `affiliate_sales(affiliate_link_id, transaction_id)` | Double commission |
| Commission partenaire | `partner_commissions(partner_id, payment_reference)` | Double commission |

### 8.7 Balance check avant payout

```typescript
// Vérification obligatoire dans process-payout & process-partner-payout
const balanceRes = await fetch('https://api.paystack.co/balance', {
  headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
});
const availableBalance = balanceData.data[0].balance / 100;
if (availableBalance < payout.amount) {
  // Insert platform_alerts (severity: 'critical')
  // Return error — payout bloqué
}
```

### 8.8 Recipient lock post-payout

Après le premier payout réussi :
- `payout_profiles.recipient_locked = true` (affiliés)
- Empêche la modification des coordonnées bancaires
- Prévention : détournement de fonds après compromission de compte

### 8.9 Audit trail

Chaque opération financière génère un enregistrement dans `audit_logs` :
- Action : `payout_approved`, `payout_rejected`, `settlement_released`, `dispute_opened`, `partner.kyc_submitted`, etc.
- Métadonnées : montant, devise, référence, codes de transfert
- User_id de l'acteur (superadmin pour les opérations admin)
- Organisation_id pour le contexte

---

## 9. Compliance & Risques

### 9.1 Position juridique

- **Incorporation** : Delaware (US) corporation
- **Statut** : Fournisseur d'infrastructure SaaS
- **PAS** : établissement financier, fintech, PSP, money transmitter
- **Juridiction** : Delaware pour les litiges
- Les organisations (tenants) sont les Merchant of Record pour leurs transactions

### 9.2 Gestion KYC

**Modèle : « Collect First, KYC Later »**

| Phase | KYC requis ? | Détails |
|-------|-------------|---------|
| Vente de produits | ❌ | L'org peut vendre immédiatement |
| Collecte de dons | ❌ | Fonds retenus dans le compte principal |
| Demande de payout | ✅ | KYC obligatoire avant tout retrait |
| Subaccount Paystack | ✅ | KYC délégué à Paystack lors de la création |
| Stripe Connect (futur) | ✅ | KYC délégué à Stripe Express |

**Délégation KYC** : La plateforme ne stocke pas de données d'identité de façon durable. Elle stocke uniquement :
- `kyc_status` (enum : none, pending, approved, rejected)
- `paystack_recipient_code` / `paystack_subaccount_code` (références opaques)
- Horodatages de soumission/révision
- URLs de documents dans un bucket privé (`org-uploads`)

### 9.3 Data retention

| Type de données | Rétention | Base légale |
|----------------|-----------|-------------|
| Données utilisateur (profil) | Jusqu'à suppression du compte | Consentement |
| Transactions financières | 5 ans | Obligation légale (comptabilité) |
| KYC documents | 5 ans après fermeture | AML compliance |
| Audit logs | 5 ans | Obligation légale |
| Contenu utilisateur | Jusqu'à suppression | Contrat |
| Analytics (client_events) | 2 ans | Intérêt légitime |

### 9.4 Suppression utilisateur

Via `delete_user_account(uuid)` RPC (SECURITY DEFINER) :
1. Supprime referrals, lesson_progress, enrollments
2. Supprime affiliate_sales liées
3. Supprime purchases, donations (données financières — note : potentiel conflit avec rétention 5 ans)
4. Supprime fraud_flags
5. Supprime organisations possédées (cascade complète via `delete_organization`)
6. Supprime memberships, liens affiliés
7. Supprime notifications, push subs, watch history, likes, saves
8. Supprime payout_requests, content_reports
9. Supprime profil et rôles plateforme
10. Supprime `auth.users` row

### 9.5 Export données

- Dashboard superadmin `/superadmin/exports` pour CSV/PDF
- Utilitaires : `src/lib/csvExport.ts`, `src/lib/pdfExport.ts`
- Couverture : transactions, utilisateurs, orgs, métriques

### 9.6 Money transmitter risk mitigation

- La plateforme utilise des processeurs de paiement licenciés (Paystack, Stripe)
- Le modèle subaccount Paystack fait de l'org le Merchant of Record
- Les commissions affilié/partenaire sont des frais de service, pas des transferts d'argent
- Contrat légal explicite (Terms) définissant la plateforme comme facilitateur technique
- Documentation AML (/aml) et politique de compliance (/compliance) publiques

---

## 10. Monitoring & Observabilité

### 10.1 Logging centralisé

| Source | Destination | Rétention |
|--------|-------------|-----------|
| Edge Functions (console.log/error) | Supabase Functions Logs | 7 jours |
| Frontend errors | Sentry (@sentry/react) | 30 jours |
| Database queries | Supabase Postgres Logs | 7 jours |
| Auth events | Supabase Auth Logs | 7 jours |

### 10.2 Alertes webhook failures

```typescript
// paystack-webhook : log systématique
console.error('Invalid Paystack signature');  // → visible dans Functions Logs
console.error('No reference in webhook data');

// stripe-webhook :
console.error('[stripe-webhook] Invalid signature');
console.error('[stripe-webhook] Missing metadata:', meta);
```

**`platform_alerts`** table pour alertes critiques automatisées :
- `alert_type: 'insufficient_balance'` → solde insuffisant pour payout
- `alert_type: 'balance_check_failed'` → API balance inaccessible
- `severity: 'critical' | 'warning' | 'info'`

### 10.3 Alertes payout failures

Chaque échec de transfert Paystack est logué dans :
1. `audit_logs` avec `action: 'payout_transfer_failed'`
2. `platform_alerts` si c'est un problème de balance
3. Email au demandeur (template `payout_rejected`)
4. Le payout_request reste en `status: 'requested'` (pas marqué 'paid')

### 10.4 Monitoring balance PSP

- Vérification en temps réel avant chaque payout (affilié + partenaire)
- API Paystack `/balance` interrogée dynamiquement
- Alerte critique si balance insuffisante
- Pas de cache (vérification live à chaque demande)

### 10.5 Tracking erreurs Edge Functions

- `console.error()` dans chaque catch block avec préfixe identifiant (`[stripe-webhook]`, `[verify-payment]`, etc.)
- Supabase Dashboard → Functions → Logs pour consultation
- Erreurs non-fatales (affiliate processing, email sending) : loguées mais n'échouent pas la transaction principale

---

## 11. Scalabilité

### 11.1 Limites actuelles

| Contrainte | Limite | Impact |
|------------|--------|--------|
| Supabase query limit | 1000 rows/query | Pagination requise pour listes volumineuses |
| Edge Function timeout | 60s | Suffisant pour les opérations actuelles |
| Rate limiting in-memory | Par instance | Reset au redéploiement (acceptable) |
| Paystack webhook idempotency | Table `payment_events` | Croissance linéaire à surveiller |
| `release-settlement` batch | 100 transactions/run | Multiple runs nécessaires pour gros volumes |

### 11.2 Points critiques

1. **Rate limiter in-memory** : Ne persiste pas entre les instances Edge Function. Acceptable pour le volume actuel mais nécessitera Redis/KV store pour le scaling.

2. **Metrics aggregation** : `aggregate-metrics` est une fonction batch. À haute volumétrie, envisager des materialized views PostgreSQL.

3. **Webhook ordering** : Les webhooks Paystack/Stripe n'ont pas de garantie d'ordre. L'idempotency protège mais des race conditions sont possibles sur des transactions très rapprochées.

4. **Single Paystack account** : Toutes les orgs partagent un seul compte Paystack avec des subaccounts. Limite Paystack à vérifier pour le nombre de subaccounts.

### 11.3 Plan multi-PSP

| Phase | Scope | Timeline estimé |
|-------|-------|-----------------|
| ✅ Phase 1 | Paystack (Afrique) + Stripe Checkout (Global) | Déployé |
| Phase 2 | Stripe Connect Express pour payouts internationaux | Q2 2026 |
| Phase 3 | Flutterwave (backup Afrique) si nécessaire | Q4 2026 |
| Phase 4 | Provider abstraction layer complet avec interface admin | 2027 |

### 11.4 Plan haute volumétrie

| Seuil | Action requise |
|-------|---------------|
| 100+ orgs | Monitoring proactif, alertes automatisées |
| 1 000+ orgs | Index supplémentaires, partitionnement `audit_logs` |
| 10 000+ orgs | Sharding logique par région, read replicas |
| 100 000+ tx/mois | Queue system (BullMQ/Inngest) pour webhooks, worker pool |

### 11.5 Séparation logique à 10 000+ organisations

```
Option A : Partitionnement logique
  └─ tenant_id indexing + connection pooling
  └─ Materialized views pour métriques cross-org

Option B : Multi-database
  └─ DB par région (Afrique, Europe, Americas)
  └─ Routing layer dans Edge Functions

Option C : Migration Supabase → infrastructure dédiée
  └─ PostgreSQL dédié + PgBouncer
  └─ Edge Functions → containerized Deno workers
```

---

## 12. Diagrammes finaux

### 12.1 Flux paiement complet

```
┌──────────┐     ┌──────────────────┐     ┌──────────────────┐
│  ACHETEUR │     │    FRONTEND      │     │  EDGE FUNCTIONS  │
└─────┬─────┘     └────────┬─────────┘     └────────┬─────────┘
      │                    │                        │
      │  Choisit produit   │                        │
      ├───────────────────►│                        │
      │                    │                        │
      │  Choisit méthode   │                        │
      │  (MoMo ou Card)    │                        │
      ├───────────────────►│                        │
      │                    │                        │
      │         ┌──────────┴──────────┐             │
      │         │ method='mobile_     │             │
      │         │ money' ?            │             │
      │         └──┬──────────────┬───┘             │
      │            │ OUI         │ NON              │
      │            ▼              ▼                  │
      │    ┌───────────┐  ┌─────────────────┐       │
      │    │ Paystack   │  │ stripe-create-  │       │
      │    │ Inline     │  │ checkout        │◄──────┤
      │    │ Popup      │  │                 │       │
      │    └─────┬──────┘  └────────┬────────┘       │
      │          │                  │                 │
      │          │ Success          │ Redirect        │
      │          ▼                  ▼                 │
      │  ┌──────────────┐  ┌──────────────┐          │
      │  │verify-payment│  │Stripe Hosted │          │
      │  │(Paystack API)│  │Checkout Page │          │
      │  └──────┬───────┘  └──────┬───────┘          │
      │         │                 │ Payment           │
      │         │                 ▼                   │
      │         │         ┌──────────────┐           │
      │         │         │stripe-webhook│           │
      │         │         │(signature    │           │
      │         │         │ verified)    │           │
      │         │         └──────┬───────┘           │
      │         │                │                   │
      │         ▼                ▼                   │
      │  ┌──────────────────────────────────┐        │
      │  │      LOGIQUE COMMUNE :           │        │
      │  │  1. Idempotency check            │        │
      │  │  2. Load organization            │        │
      │  │  3. Calculate fees               │        │
      │  │  4. Resolve affiliate            │        │
      │  │  5. Insert/Update transaction    │        │
      │  │  6. Create affiliate_sale        │        │
      │  │  7. Calculate partner commission │        │
      │  │  8. Notify users + admins        │        │
      │  │  9. Send emails                  │        │
      │  │  10. Audit log                   │        │
      │  └──────────────────────────────────┘        │
      │                    │                         │
      │   ◄────────────────┤  Redirect/Response      │
      │   Payment Success  │                         │
      ▼   Page             │                         │
```

### 12.2 Flux payout

```
                    ┌──────────────┐
                    │   DEMANDEUR  │
                    │ (Affilié/    │
                    │  Partenaire/ │
                    │  Org Owner)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       request-      request-     (UI Admin
       affiliate-    partner-     Org Payout)
       payout        payout
              │            │            │
              │ JWT + KYC  │ JWT +      │
              │ + membership│ ownership │
              │ check      │ check      │
              └────────────┼────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │ payout_requests │
                 │ / partner_      │
                 │   payout_       │
                 │   requests      │
                 │ status:requested│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   SUPERADMIN    │
                 │   REVIEW        │
                 └────────┬────────┘
                          │
              ┌───────────┼───────────┐
              │ APPROVE               │ REJECT
              ▼                       ▼
     ┌────────────────┐     ┌─────────────────┐
     │ Balance Check  │     │ Revert status   │
     │ (Paystack API) │     │ Notify user     │
     └───────┬────────┘     │ Audit log       │
             │              └─────────────────┘
             │ OK
             ▼
     ┌────────────────┐
     │ Paystack       │
     │ Transfer API   │
     │ source:balance │
     │ recipient:     │
     │ recipient_code │
     └───────┬────────┘
             │
     ┌───────┼───────┐
     │ Success       │ Failure
     ▼               ▼
  ┌────────┐    ┌─────────────┐
  │ Status │    │ Audit log   │
  │ → paid │    │ Status kept │
  │ Lock   │    │ Alert       │
  │ recipt.│    └─────────────┘
  │ Notify │
  │ Email  │
  │ Audit  │
  └────────┘
```

### 12.3 Diagramme partenaire

```
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│  PARTENAIRE  │         │  ORGANISATION │        │   ACHETEUR   │
└──────┬───────┘         └──────┬───────┘        └──────┬───────┘
       │                        │                        │
       │ invite_code            │                        │
       ├───────────────────────►│                        │
       │                        │                        │
       │     attribute_org_     │                        │
       │     to_partner() RPC   │                        │
       │     ┌──────────────────┤                        │
       │     │ partner_referrals│                        │
       │     │ (status: pending)│                        │
       │     └──────────────────┤                        │
       │                        │                        │
       │                        │ Vend produit           │
       │                        ├────────────────────────┤
       │                        │                        │
       │                        │      Paiement          │
       │                        │◄───────────────────────┤
       │                        │                        │
       │                        │  verify-payment /      │
       │                        │  webhook               │
       │                        │  ┌─────────────────┐   │
       │                        │  │ platform_fee     │   │
       │                        │  │ = amount × 10%   │   │
       │                        │  │                  │   │
       │  partner_commission    │  │ partner_comm     │   │
       │  = platform_fee × rate%│  │ = fee × rate%    │   │
       │◄───────────────────────┤  └─────────────────┘   │
       │                        │                        │
       │  status: 'held'        │                        │
       │  payable_at: +15 days  │                        │
       │                        │                        │
       │  ... 15 jours ...      │                        │
       │                        │                        │
       │  request-partner-payout│                        │
       ├───────────────────────►│                        │
       │                        │                        │
       │  superadmin approve    │                        │
       │  → Paystack Transfer   │                        │
       │◄──────────────────────►│                        │
       │  💰 Fonds reçus       │                        │
```

### 12.4 Diagramme routing multi-PSP

```
┌─────────────────────────────────────────────────────────┐
│                    CHECKOUT FLOW                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           PaymentMethodSelector                   │   │
│  │                                                   │   │
│  │  [📱 Mobile Money]          [💳 Carte bancaire]  │   │
│  │   Paystack                    Stripe              │   │
│  │   (CI, GH, NG, KE, ZA, EG)  (Mondial)           │   │
│  └────────┬─────────────────────────────┬────────────┘   │
│           │                             │                │
│           ▼                             ▼                │
│  ┌────────────────┐          ┌─────────────────────┐    │
│  │ usePaystack()  │          │ stripe-create-      │    │
│  │ Inline popup   │          │ checkout             │    │
│  │ Reference:     │          │ Reference:           │    │
│  │ SV-{ts}-{rand} │          │ SV-STRIPE-{ts}-{r}  │    │
│  └────────┬───────┘          └──────────┬──────────┘    │
│           │                             │                │
│           ▼                             ▼                │
│  ┌────────────────┐          ┌─────────────────────┐    │
│  │verify-payment  │          │stripe-webhook       │    │
│  │(Paystack API)  │          │(Stripe signature)   │    │
│  └────────┬───────┘          └──────────┬──────────┘    │
│           │                             │                │
│           └────────────┬────────────────┘                │
│                        ▼                                 │
│           ┌─────────────────────────┐                    │
│           │  MÊME LOGIQUE MÉTIER :  │                    │
│           │  • fees                 │                    │
│           │  • commissions          │                    │
│           │  • settlements          │                    │
│           │  • notifications        │                    │
│           │  • audit logs           │                    │
│           └─────────────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

### 12.5 Diagramme permissions/RLS

```
┌──────────────────────────────────────────────────────┐
│                    REQUEST                            │
│                    (Supabase Client)                  │
└───────────────────────┬──────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  auth.uid()     │
              │  Qui suis-je ?  │
              └────────┬────────┘
                       │
          ┌────────────┼────────────────┐
          │            │                │
          ▼            ▼                ▼
  ┌──────────────┐ ┌───────────┐ ┌──────────────┐
  │ Table publique│ │ Table org │ │Table platform│
  │ (profiles,   │ │ (media,   │ │(user_platform│
  │  orgs read)  │ │  products)│ │ _roles)      │
  └──────┬───────┘ └─────┬─────┘ └──────┬───────┘
         │               │              │
         ▼               ▼              ▼
  ┌──────────┐   ┌───────────────┐ ┌──────────┐
  │ RLS:     │   │ RLS:          │ │ RLS:     │
  │ true     │   │ is_org_member │ │ user_id  │
  │ (lecture)│   │ can_manage_org│ │ = uid()  │
  │          │   │ can_admin_org │ │          │
  │ user_id  │   │ SECURITY      │ │ is_super │
  │ = uid()  │   │ DEFINER       │ │ admin()  │
  │ (écriture│   │ (no recursion)│ │          │
  └──────────┘   └───────────────┘ └──────────┘
```

---

## 13. Confirmations de sécurité

Les points suivants sont explicitement confirmés par l'analyse du code source :

### ✅ `verify-payment` revalide via l'API PSP

```typescript
// verify-payment/index.ts, ligne 101
const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
  headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
});
const psData = await psRes.json();
if (!psData.status || psData.data?.status !== 'success') {
  return new Response(JSON.stringify({ error: 'Payment not successful' }), { status: 400 });
}
```
Le statut du paiement est TOUJOURS vérifié côté serveur via l'API Paystack, jamais accepté uniquement sur la base du callback frontend.

### ✅ Aucune Edge Function financière sans JWT (ou signature webhook)

| Fonction | Protection |
|----------|-----------|
| `process-payout` | JWT + superadmin role check |
| `process-partner-payout` | JWT + superadmin role check |
| `request-affiliate-payout` | JWT + getClaims() + membership check |
| `request-partner-payout` | JWT + getUser() + ownership check |
| `release-settlement` | JWT (superadmin) ou token cron |
| `paystack-webhook` | HMAC SHA-512 signature |
| `stripe-webhook` | HMAC SHA-256 signature avec tolérance 5min |
| `verify-payment` | Revalide via API PSP (non-critical si non auth) |

### ✅ Solde plateforme vérifié avant payout

```typescript
// process-payout/index.ts, ligne 123
const balanceRes = await fetch('https://api.paystack.co/balance', {...});
if (availableBalance < payout.amount) {
  await db.from('platform_alerts').insert({
    alert_type: 'insufficient_balance', severity: 'critical', ...
  });
  return new Response(JSON.stringify({ error: 'Insufficient platform balance' }), { status: 400 });
}
```
Vérifié dans `process-payout` (affiliés) ET `process-partner-payout` (partenaires).

### ✅ Refund bloque commission liée

```typescript
// process-partner-payout/index.ts, ligne 121-135
const { data: validCommissions } = await db.from('partner_commissions')
  .select('id').in('id', commissionIds).eq('status', 'payable');
const invalidIds = commissionIds.filter(id => !validIds.has(id));
if (invalidIds.length) {
  return new Response(JSON.stringify({
    error: `${invalidIds.length} commission(s) ne sont plus disponibles (refund/dispute)`,
  }), { status: 400 });
}
```
Les commissions refundées/disputées changent de status et ne sont plus payables.

### ✅ MoMo payout activé uniquement via capabilities API

```typescript
// check-payout-capabilities : interroge Paystack /bank en temps réel
// Résultat caché 24h — MoMo uniquement si le processeur confirme le support
// pour la devise et le pays concernés
```

### ✅ Séparation affiliate / partner garantie

- **Tables séparées** : `affiliate_*` vs `partner_*`
- **Logique séparée** : `request-affiliate-payout` vs `request-partner-payout`
- **Processing séparé** : `process-payout` (affiliés) vs `process-partner-payout` (partenaires)
- **Assiette différente** : Commission affilié sur montant total vs Commission partenaire sur platform_fee uniquement
- **Aucune clé étrangère croisée** entre les deux systèmes
- **Exclusion dons** : Les deux systèmes excluent les dons des commissions (confirmé dans le code des 3 fonctions de vérification)

---

*Document généré le 25 février 2026.*
*Basé sur l'analyse exhaustive du code source Siteviral (29 Edge Functions, 60+ tables, 20+ RPC functions).*
*Pour questions techniques : consulter les logs Edge Functions dans le dashboard Supabase.*
