# 🔧 SITEVIRAL — Audit Technique Complet (Mars 2026)

> **Document confidentiel** — Destiné exclusivement à l'équipe technique.  
> Dernière mise à jour : 1er mars 2026

---

## TABLE DES MATIÈRES

1. [Architecture Générale](#1-architecture-générale)
2. [Stack Technologique](#2-stack-technologique)
3. [Base de Données & Schéma](#3-base-de-données--schéma)
4. [Authentification & Rôles](#4-authentification--rôles)
5. [Système de Paiement (Dual-Gateway)](#5-système-de-paiement-dual-gateway)
6. [Cycle de Vie d'une Transaction](#6-cycle-de-vie-dune-transaction)
7. [Gestion des Fonds & Settlements](#7-gestion-des-fonds--settlements)
8. [Programme Ambassadeur (Affiliation)](#8-programme-ambassadeur-affiliation)
9. [Programme Partenaire (B2B)](#9-programme-partenaire-b2b)
10. [Edge Functions — Inventaire Complet](#10-edge-functions--inventaire-complet)
11. [Système de Notifications & Emails](#11-système-de-notifications--emails)
12. [Sécurité & Anti-Fraude](#12-sécurité--anti-fraude)
13. [Points d'Attention & Pièges Connus](#13-points-dattention--pièges-connus)
14. [Flux de Données Critiques (Diagrammes)](#14-flux-de-données-critiques)
15. [Secrets & Configuration](#15-secrets--configuration)

---

## 1. Architecture Générale

```
┌────────────────────────────────────────────────────┐
│                  FRONTEND (SPA)                     │
│  React 18 + Vite + TypeScript + Tailwind CSS       │
│  Hébergé : Lovable Cloud (graceconnect.lovable.app)│
└──────────────┬─────────────────────────────────────┘
               │ HTTPS (REST + Realtime)
               ▼
┌────────────────────────────────────────────────────┐
│              SUPABASE (Backend-as-a-Service)        │
│  Projet ID : xzgpzbrgsxtcsktiprik                  │
│  URL API : https://api.siteviral.com               │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  PostgreSQL  │  │ Edge Funcs   │  │  Storage  │ │
│  │  (RLS actif) │  │ (Deno/V8)    │  │  (S3)     │ │
│  └─────────────┘  └──────────────┘  └───────────┘ │
│  ┌─────────────┐  ┌──────────────┐                 │
│  │    Auth      │  │  Realtime    │                 │
│  │ (GoTrue)     │  │ (WebSocket)  │                 │
│  └─────────────┘  └──────────────┘                 │
└──────────────┬─────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Paystack│ │ Stripe │ │ Resend │
│(MoMo)  │ │(Cards) │ │(Emails)│
└────────┘ └────────┘ └────────┘
```

### Modèle Multi-Tenant

Siteviral est une **plateforme multi-tenant** où chaque "organisation" est un tenant isolé. Les données sont cloisonnées via :
- **RLS (Row-Level Security)** sur PostgreSQL
- **`organization_id`** comme clé de partition dans toutes les tables métier
- **Rôles hiérarchiques** : `owner > admin > editor > member > affiliate`

---

## 2. Stack Technologique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| Frontend | React + TypeScript | 18.3.1 | SPA client-side |
| Build | Vite | 5.x | Bundler + HMR |
| CSS | Tailwind CSS | 3.x | Design system utility-first |
| UI Components | shadcn/ui + Radix | Latest | Composants accessibles |
| Animations | Framer Motion | 12.x | Transitions & micro-interactions |
| Routing | React Router DOM | 6.30+ | Client-side routing |
| State | React Query (TanStack) | 5.x | Server state + cache |
| Auth | Supabase Auth (GoTrue) | — | OAuth (Google) + Magic Link + OTP |
| Database | PostgreSQL (Supabase) | 15+ | Stockage principal avec RLS |
| Edge Functions | Deno (Supabase) | — | Logique serveur sécurisée |
| Paiements | Paystack + Stripe | — | Dual-gateway |
| Emails | Resend | — | Emails transactionnels |
| Push | OneSignal | — | Notifications push (web) |
| PWA | vite-plugin-pwa | 1.2 | App installable offline |
| Monitoring | Sentry | 10.x | Error tracking frontend |

---

## 3. Base de Données & Schéma

### Tables Principales (≈50+ tables)

#### 🏢 Entités Métier
| Table | Rôle | Clé de Partition |
|-------|------|-----------------|
| `organizations` | Tenants principaux | `id` |
| `organization_members` | Membres & rôles | `organization_id` |
| `profiles` | Données utilisateur globales | `id` (= auth.users.id) |
| `user_platform_roles` | Superadmin flag | `user_id` |

#### 💰 Finance
| Table | Rôle | Relations Clés |
|-------|------|---------------|
| `donations` | Dons / Offrandes | → organizations, donation_campaigns |
| `product_purchases` | Achats de produits numériques | → digital_products, organizations |
| `affiliate_sales` | Commissions ambassadeurs | → affiliate_links |
| `affiliate_links` | Liens d'affiliation | → organizations, digital_products |
| `payout_requests` | Demandes de versement | → organizations |
| `payout_profiles` | Coordonnées bancaires (isolées) | `user_id` |
| `partner_commissions` | Commissions partenaires B2B | → partners |
| `refund_requests` | Demandes de remboursement | → organizations |
| `payment_events` | Log d'idempotence webhooks | `event_id` (unique) |
| `promo_codes` | Codes promotionnels | → organizations |

#### 📦 Contenu
| Table | Rôle |
|-------|------|
| `digital_products` | Produits numériques (ebooks, cours, etc.) |
| `media_content` | Vidéos, audios, reels |
| `programs` / `program_modules` / `program_lessons` | Formations en ligne |
| `events` | Événements |
| `announcements` | Annonces |
| `donation_campaigns` | Campagnes de collecte |

#### 🔔 Engagement
| Table | Rôle |
|-------|------|
| `user_notifications` | Notifications in-app |
| `email_logs` | Historique des emails envoyés |
| `email_campaigns` | Campagnes email (newsletters) |
| `contacts` | CRM / liste de contacts |
| `content_comments` | Commentaires |
| `content_reports` | Signalements de contenu |
| `badges` / `user_badges` | Gamification |

#### 📊 Analytics
| Table | Rôle |
|-------|------|
| `org_daily_metrics` | Métriques journalières par org |
| `platform_metrics_daily` | Métriques plateforme globales |
| `client_events` | Événements analytics frontend |
| `audit_logs` | Piste d'audit (toutes actions critiques) |

#### 🔐 Sécurité / Conformité
| Table | Rôle |
|-------|------|
| `kyc_submissions` | Documents KYC (1:1 avec organizations) |
| `fraud_flags` | Alertes de fraude |
| `platform_alerts` | Alertes système (solde insuffisant, etc.) |
| `download_logs` | Traçabilité des téléchargements |

### Colonnes Critiques à Comprendre

#### `paystack_reference` (donations & product_purchases)
- **Réutilisé pour les DEUX gateways** (malgré le nom)
- Format Paystack : `SV-{timestamp}-{random}`
- Format Stripe : `SV-STRIPE-{timestamp}-{random}`
- C'est le **champ d'idempotence principal** pour toutes les transactions

#### `settlement_status` (donations & product_purchases)
- `held` → Fonds retenus (72h pour vendeurs)
- `released` → Éligible au versement
- `frozen` → Bloqué par admin (ex: org inactive)
- `disputed` → Contestation bancaire en cours
- `refunded` → Remboursé

#### `status` (affiliate_sales)
- `pending` → Commission en attente (15 jours de rétention)
- `payable` → Commission déblocable
- `paid` → Versé
- `cancelled` → Annulé (suite à remboursement)

---

## 4. Authentification & Rôles

### Méthodes d'Authentification
1. **Google OAuth** — Redirige vers `siteviral.com/auth/callback`
2. **Magic Link** — OTP par email (6 chiffres)
3. **Email + OTP** — Vérification via `verifyOtp()`

### Hiérarchie des Rôles

```
PLATEFORME
├── superadmin      → Accès total (user_platform_roles.role = 'superadmin')
└── user            → Utilisateur standard

ORGANISATION (organization_members.role)
├── owner           → Créateur, ne peut pas être rétrogradé (trigger: prevent_owner_role_change)
├── admin           → Gestion complète
├── editor          → Création de contenu
├── member          → Lecture + interactions
└── affiliate       → (legacy, remplacé par le système d'affiliate_links)
```

### Fonctions Helper SQL
```sql
is_superadmin(_user_id)      → bool  -- Vérifie le rôle plateforme
can_admin_org(_user_id, _org_id)  → bool  -- owner ou admin
can_manage_org(_user_id, _org_id) → bool  -- owner, admin ou editor
is_org_member(_user_id, _org_id)  → bool  -- Tout rôle
get_org_role(_user_id, _org_id)   → role  -- Retourne le rôle exact
```

### Création d'Organisation (Atomique)
```sql
create_organization_with_owner(_name, _slug, _category, _description, _currency)
```
- **CRITIQUE** : Utilise `SECURITY DEFINER` pour créer l'org ET l'appartenance en une seule transaction
- Évite les race conditions RLS où le membre n'est pas encore visible après l'INSERT de l'org

---

## 5. Système de Paiement (Dual-Gateway)

### Routage Dynamique

```
Utilisateur choisit "Mobile Money"  → Paystack (inline popup)
Utilisateur choisit "Carte bancaire" → Stripe (checkout hébergé)
```

### Architecture Paystack (Mobile Money)

```
Frontend (usePaystack) → Paystack Popup → Paystack Server
                                              │
                            ┌─────────────────┤
                            ▼                 ▼
                     verify-payment    paystack-webhook
                     (appelé par le    (appelé par Paystack)
                      frontend)
                            │                 │
                            ▼                 ▼
                     ┌─── PostgreSQL ───────────┐
                     │  donations / purchases    │
                     │  affiliate_sales          │
                     │  partner_commissions      │
                     │  payment_events           │
                     └───────────────────────────┘
```

**Flux détaillé :**
1. Frontend appelle `usePaystack.openPayment()` avec les paramètres
2. Le popup Paystack gère le paiement (MoMo, carte locale)
3. Paystack retourne la `reference` au callback `onSuccess`
4. Frontend redirige vers `/payment-success?reference=SV-xxx&type=product&organization_id=xxx`
5. `PaymentSuccessPage` appelle `verify-payment` (Edge Function)
6. En parallèle, Paystack envoie un webhook à `paystack-webhook`

### Architecture Stripe (Cartes internationales)

```
Frontend → stripe-create-checkout → Stripe Checkout (hosted)
                                         │
                         ┌───────────────┤
                         ▼               ▼
                   stripe-verify    stripe-webhook
                   (frontend poll)  (Stripe → Edge Fn)
                         │               │
                         ▼               ▼
                   ┌─── PostgreSQL ───────────┐
                   │  Même tables que Paystack │
                   └───────────────────────────┘
```

**Flux détaillé :**
1. Frontend appelle `stripe-create-checkout` Edge Function
2. Edge Function crée un Stripe Checkout Session avec metadata (`sv_reference`, `type`, `organization_id`, etc.)
3. Stripe redirige vers `/payment-success?reference=SV-STRIPE-xxx&session_id=cs_xxx&gateway=stripe`
4. `PaymentSuccessPage` appelle `stripe-verify`
5. En parallèle, Stripe envoie un webhook à `stripe-webhook`

### Split de Revenus (par transaction)

```
Montant brut (100%)
├── Platform Fee (10% par défaut)        → Solde principal Siteviral
│   └── Partner Commission (5-15%)       → Commission B2B (sur la platform fee uniquement)
├── Affiliate Commission (10% par défaut) → Réservé pour l'ambassadeur
│   (uniquement sur les PRODUITS, jamais sur les dons)
└── Organization Amount (reste)          → Part du vendeur
```

**Exemple concret :** Achat de 10 000 XOF
- Platform fee (10%) : 1 000 XOF → Siteviral
- Commission affilié (10%) : 1 000 XOF → Ambassadeur (après 15 jours)
- Part vendeur : 8 000 XOF → Organisation
- Si partenaire B2B (10% de la platform fee) : 100 XOF → Partenaire

---

## 6. Cycle de Vie d'une Transaction

### 6.1 Paystack (Mobile Money)

```
1. INITIATION
   Frontend → usePaystack.openPayment() → Paystack Popup
   
2. PAIEMENT RÉUSSI
   Paystack → callback(reference) → Redirection /payment-success
   
3. VÉRIFICATION (Double voie)
   
   VOIE A (Frontend → verify-payment Edge Fn):
   ├── Vérifie avec API Paystack (GET /transaction/verify/{ref})
   ├── Vérifie idempotence (paystack_reference unique)
   ├── Calcule fees (platform, affiliate, partner)
   ├── INSERT/UPDATE donations OU product_purchases
   ├── INSERT affiliate_sales (si applicable)
   ├── INSERT partner_commissions (si applicable)
   ├── INSERT user_notifications
   ├── SEND emails (fire-and-forget via Resend)
   └── Retourne { ok: true, transaction_id, breakdown }
   
   VOIE B (Paystack → paystack-webhook Edge Fn):
   ├── Vérifie signature HMAC-SHA512
   ├── Vérifie idempotence (payment_events.event_id)
   ├── Si déjà completed → ensureAffiliateProcessed() → return
   ├── Si pending → complete + notifications
   ├── Si pas de record → créer from metadata
   └── Gère aussi: disputes, transfers
   
4. SETTLEMENT (release-settlement, après 72h)
   ├── settlement_status: held → released
   └── Notifie les admins de l'org
   
5. PAYOUT (request-affiliate-payout + process-payout)
   ├── Affiliés : virement Paystack Transfer API
   └── Orgs : basculement subaccount manual→auto→manual
```

### 6.2 Stripe (Cartes)

```
1. INITIATION
   Frontend → stripe-create-checkout Edge Fn → Stripe Checkout Session
   
2. PAIEMENT (sur Stripe Hosted Checkout)
   Stripe → Redirection vers success_url avec session_id
   
3. VÉRIFICATION (Triple voie pour résilience)
   
   VOIE A (Frontend → stripe-verify Edge Fn):
   ├── Si pas de reference → résoudre via session_id (API Stripe)
   ├── Vérifie dans DB (maybe déjà traité par webhook)
   ├── Si non → vérifie avec API Stripe (session.payment_status === 'paid')
   ├── Calcule fees + INSERT transaction
   ├── Même logique affiliate/partner que verify-payment
   └── Notifications + emails
   
   VOIE B (Stripe → stripe-webhook Edge Fn):
   ├── Vérifie signature HMAC-SHA256
   ├── Fallback: si signature invalide → fetch event depuis Stripe API
   ├── Gère uniquement checkout.session.completed
   ├── Récupère metadata depuis PaymentIntent (plus fiable)
   ├── Même logique de transaction que stripe-verify
   └── Idempotent via paystack_reference unique
   
   VOIE C (Frontend polling dans PaymentSuccessPage):
   ├── 8 tentatives avec backoff progressif (2s→8s)
   ├── lookupTransaction() par reference OU par user_id (fallback 5 min)
   └── Bouton "Vérifier à nouveau" en cas d'échec
```

### 6.3 Produits Gratuits

```
Frontend → claim-free-product Edge Fn
├── Auth via SUPABASE_ANON_KEY (RLS-aware)
├── Vérifie: is_free=true, is_published=true, org_id match
├── Vérifie: pas déjà récupéré (idempotent)
├── INSERT product_purchases (amount=0, ref=free-{userId}-{ts})
├── Notifications acheteur + admins
└── Pas de commission affilié ni partner
```

---

## 7. Gestion des Fonds & Settlements

### Architecture Subaccount Paystack

Chaque organisation peut avoir un **subaccount Paystack** :
- `settlement_schedule: 'manual'` → Les fonds sont retenus
- La plateforme contrôle quand les fonds sont libérés
- `transaction_charge` = platform fee + affiliate commission → va dans le solde principal Siteviral

**Création du subaccount :** `create-paystack-subaccount` Edge Function
- Vérifie : auth, rôle admin/owner, KYC, monetization_enabled
- Vérifie : pays supporté (via `supported_payout_countries`)
- Supporte : virement bancaire OU Mobile Money (Orange, MTN, Moov)
- Met en escrow automatique via `settlement_schedule: 'manual'`

### Flux de Settlement (72h hold)

```
Transaction complétée → settlement_status = 'held'
        │
        │  (après 72h)
        ▼
release-settlement Edge Fn (cron ou superadmin)
├── Batch de 200 transactions max par invocation
├── Cursor-based pagination pour scalabilité
├── Vérifie: pas de dispute_status, org active, payouts non gelés
├── held → released (ou frozen si org inactive)
└── Audit log + email aux admins org
```

### Flux de Payout (Versement)

#### Affiliés (Ambassadeurs)
```
1. request-affiliate-payout (déclenché par l'ambassadeur)
   ├── Auth + membership check
   ├── Payout freeze check
   ├── KYC check (org-level)
   ├── Trouve les affiliate_sales avec status='pending' ET payable_at < now()
   ├── Change status → 'payable'
   └── Crée payout_request (type='affiliate')

2. process-payout (déclenché par superadmin)
   ├── Auth superadmin only
   ├── Vérifie payable_at de chaque sale (15 jours minimum)
   ├── Vérifie solde Paystack principal (balance check)
   ├── Paystack Transfer API (source: 'balance')
   ├── Si transfert réussi → status='paid', lock recipient
   └── Si échec → audit log, pas de changement de status
```

#### Organisations (Vendeurs)
```
process-payout (type='org')
├── Vérifie released funds >= requested amount
├── Calcule available = released_funds - already_paid_out
├── Switch subaccount: manual → auto (libère les fonds)
├── Immédiatement switch back: auto → manual
├── Status → 'paid'
└── Audit log
```

⚠️ **PIÈGE CONNU** : Le switch auto→manual est une opération non-atomique. Si l'Edge Function crash entre les deux appels, le subaccount reste en mode 'auto'. C'est documenté comme "non-fatal" dans le code, mais il y a un risque de fuite de fonds si Paystack traite des transactions pendant cette fenêtre.

---

## 8. Programme Ambassadeur (Affiliation)

### Inscription
```sql
-- Fonction atomique SQL
self_enroll_affiliate(_org_id)
├── Vérifie auth + org active + affiliation_enabled
├── Bloque l'auto-inscription du owner
├── Ajoute comme member (si pas déjà) avec rôle 'member'
├── Crée affiliate_link avec code unique: {SLUG-6chars}-{USERID-6chars}
└── Pas de changement de rôle si déjà membre
```

### Tracking d'Attribution
- Table `affiliate_attributions` : cookie-based tracking (30 jours)
- Hook frontend `useAffiliateCapture` : capture le code affilié depuis l'URL
- Code stocké en `localStorage` avec TTL

### Commission
- **Uniquement sur les produits** (jamais sur les dons/campagnes)
- Taux par défaut : 10% (configurable par org : `affiliation_commission_percent`)
- Plage : 5% à 50%
- **Rétention de 15 jours** avant paiement (`payable_at`)
- Anti-fraude : l'affilié ne peut pas être l'acheteur

### Payout
- Minimum : aucun (toute commission est payable)
- Via Paystack Transfer API depuis le solde principal Siteviral
- Verrouillage des coordonnées bancaires après 1er versement (`recipient_locked`)
- KYC obligatoire au niveau de l'organisation

---

## 9. Programme Partenaire (B2B)

### Structure
- Partenaires B2B qui réfèrent des **organisations** (pas des utilisateurs finaux)
- 5 niveaux : Bronze (5%) → Silver (8%) → Gold (10%) → Platinum (12%) → Diamond (15%)
- Commission calculée sur la **platform fee uniquement** (pas sur le montant brut)
- Single-level (pas de MLM)

### Fonctions SQL Clés
```sql
attribute_org_to_partner(_org_id, _partner_code)  → Attribution d'une org
compute_partner_level(_partner_id)                → Calcul du niveau
get_partner_rate(_partner_id)                     → Taux effectif
manage_partner(_partner_id, _action, _reason)     → Approve/reject/suspend
```

### Anti-Fraude
- Blocage auto-référencement (partner ≠ owner de l'org)
- Verrouillage attribution (une org ne peut être attribuée qu'une fois)
- Verrouillage coordonnées bancaires après 1er payout

---

## 10. Edge Functions — Inventaire Complet

### 💰 Paiements (6 fonctions)
| Fonction | JWT | Rôle | Description |
|----------|-----|------|-------------|
| `verify-payment` | Non (vérifie manuellement) | Tout user auth | Vérifie paiement Paystack + enregistre transaction |
| `stripe-create-checkout` | Non | Tout user | Crée session Stripe Checkout |
| `stripe-verify` | Non | Tout user auth | Vérifie paiement Stripe + enregistre si webhook n'a pas encore traité |
| `stripe-webhook` | Non | Stripe (signature) | Webhook Stripe → enregistre transaction |
| `paystack-webhook` | Non | Paystack (signature) | Webhook Paystack → enregistre transaction |
| `claim-free-product` | Non | User auth (anon key) | Récupération produit gratuit |

### 💸 Payouts (7 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `create-paystack-subaccount` | Admin/Owner org | Crée sous-compte Paystack |
| `create-transfer-recipient` | User auth | Crée recipient Paystack pour affilié |
| `create-transfer-recipient-partner` | User auth | Crée recipient pour partenaire |
| `request-affiliate-payout` | Membre org | Demande de versement affilié |
| `request-partner-payout` | Partenaire | Demande de versement partenaire |
| `process-payout` | Superadmin | Traite versement affilié/org |
| `process-partner-payout` | Superadmin | Traite versement partenaire |

### 🔄 Settlement & Migration (3 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `release-settlement` | Superadmin/Cron | Libère les fonds après 72h |
| `settle-pre-subaccount` | Admin org | Reattribue les fonds pré-subaccount |
| `migrate-subaccounts` | Superadmin | Migration batch vers architecture subaccount |

### 💳 Stripe Connect (2 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `stripe-connect-onboarding` | Admin org | Génère lien d'onboarding Stripe Connect |
| `stripe-connect-status` | Admin org | Vérifie statut Stripe Connect |

### 🔐 Vérification & Sécurité (2 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `refund-transaction` | Admin org / Superadmin | Remboursement via Paystack/Stripe |
| `check-payout-capabilities` | Admin org | Vérifie support pays/méthode |

### 📧 Communications (4 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `send-email` | Service interne | Template engine + envoi via Resend |
| `send-campaign` | Admin org | Envoi campagne email en masse |
| `send-push` | Admin org | Push notification via OneSignal |
| `onesignal-test-push` | Admin | Test push notification |

### 📊 Analytics & AI (2 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `aggregate-metrics` | Cron | Agrège métriques J-1 (org + plateforme) |
| `superadmin-ai-chat` | Superadmin | Chat IA pour requêtes admin |

### 🔗 Autres (5 fonctions)
| Fonction | Rôle | Description |
|----------|------|-------------|
| `generate-signed-url` | User auth | URL signée pour fichiers privés |
| `generate-preview` | Public | Aperçu de produit (premières pages) |
| `watermark-download` | User auth | Téléchargement sécurisé avec watermark |
| `share-meta` | Public | Proxy OG metadata pour partage social |
| `sitemap` | Public | Génération dynamique du sitemap XML |
| `automated-emails` | Cron | Emails automatisés (onboarding, rappels) |

---

## 11. Système de Notifications & Emails

### Notifications In-App
- Table : `user_notifications`
- Types : 55+ (purchase, donation, commission, payout, system, etc.)
- Temps réel via Supabase Realtime (hook `useRealtimeNotifications`)
- Mark as read / suppression unitaire

### Templates Email (87+)
Gérés dans `src/lib/api.ts` → type `EmailTemplate`

Catégories :
- Auth (welcome, password_changed, etc.)
- Transactions (donation_receipt, purchase_confirmation)
- Affiliés (affiliate_sale, affiliate_payout_completed)
- Partenaires (partner_commission_earned, partner_payout_sent)
- KYC (kyc_approved, kyc_rejected)
- Admin (daily_recap_admin, fraud_alert)
- Re-engagement (inactive_7d/14d/30d)

### Envoi d'Email — Architecture
```
Appelant (Edge Fn ou Frontend)
    │
    ▼
send-email-helper.ts (shared)
    │
    ▼ (fetch interne)
send-email Edge Fn
    │
    ├── Template rendering (HTML)
    ├── Résolution destinataires (si to='' → admins org)
    ├── Envoi via Resend API
    └── Log dans email_logs
```

---

## 12. Sécurité & Anti-Fraude

### 12.1 Authentification & Autorisation
- JWT vérifié manuellement dans chaque Edge Function (pas via `verify_jwt` de Supabase)
- Raison : permet de gérer les cas non-auth (webhooks, pages publiques)
- **Toutes les fonctions ont `verify_jwt = false`** dans `config.toml`

### 12.2 Validation des Webhooks
- **Paystack** : HMAC-SHA512 (`x-paystack-signature`)
- **Stripe** : HMAC-SHA256 (`stripe-signature`) avec tolérance de 5 minutes
- **Fallback Stripe** : Si signature invalide → fetch event directement depuis Stripe API

### 12.3 Rate Limiting
- In-memory Map par IP (60 req/min pour webhooks, 20/min pour verify, 10/min pour payouts)
- ⚠️ **LIMITATION** : Le rate limiting est in-memory dans l'Edge Function. Il est reset à chaque cold start. Pas de persistance entre les instances.

### 12.4 Anti-Fraude sur les Paiements
- L'affilié ne peut pas être l'acheteur (vérifié dans verify-payment, stripe-webhook, etc.)
- Self-referral bloqué pour les partenaires (vérifié dans `attribute_org_to_partner`)
- Verrouillage des coordonnées bancaires après 1er payout (`recipient_locked`)
- Vérification du solde Paystack avant tout payout affilié
- Gel des payouts possible par superadmin (`payouts_frozen` sur organizations)

### 12.5 Isolation des Données Sensibles
- Coordonnées bancaires dans `payout_profiles` (table séparée avec RLS strict)
- KYC documents dans bucket `kyc-documents` (privé, pas de lecture publique)
- Produits numériques dans bucket `private-products` (URLs signées)

### 12.6 Idempotence
- **Paystack webhook** : `payment_events.event_id` (unique)
- **Transactions** : `paystack_reference` (unique dans donations ET product_purchases)
- **Affiliate sales** : unique(`affiliate_link_id`, `transaction_id`)
- **Partner commissions** : unique(`partner_id`, `payment_reference`)

### 12.7 Audit Trail
- Table `audit_logs` : enregistre toutes les actions critiques
- Inclut : user_id, organization_id, action, resource_type, resource_id, metadata
- Actions tracées : kyc_submitted/approved/rejected, payout_approved/rejected, subaccount_created, settlement_released, refund, dispute, etc.

---

## 13. Points d'Attention & Pièges Connus

### 🔴 CRITIQUE

1. **Duplication de logique métier (verify-payment / stripe-verify / stripe-webhook / paystack-webhook)**
   - La logique de calcul des fees, enregistrement de transaction, commission affilié et partner est **dupliquée dans 4 Edge Functions**
   - Risque : une modification dans une fonction et pas dans les autres crée des incohérences
   - **Action recommandée** : Extraire dans un module shared `_shared/process-transaction.ts`

2. **Race condition Stripe verify vs webhook**
   - `stripe-verify` ET `stripe-webhook` peuvent tenter de créer la même transaction
   - Protection actuelle : check DB avant insert + `paystack_reference` unique
   - **Mais** : si les deux s'exécutent simultanément, un des deux échouera avec une erreur unique constraint
   - Le code ne catch pas explicitement cette erreur partout

3. **Payout org : switch settlement_schedule non-atomique**
   - Le switch `manual → auto → manual` fait 2 appels HTTP séparés à Paystack
   - Si crash entre les deux : le subaccount reste en mode 'auto' → fonds libérés automatiquement
   - **Action recommandée** : Implémenter un lock ou un flag DB + cron de vérification

4. **`paystack_reference` utilisé pour DEUX gateways**
   - Le nom de colonne est trompeur pour Stripe
   - Pas de colonne dédiée `gateway` dans donations/purchases
   - On distingue via le préfixe (`SV-STRIPE-` vs `SV-`)
   - **Risque** : confusion lors de requêtes manuelles ou debugging

### 🟡 IMPORTANT

5. **Rate limiting non-persistant**
   - En-memory Map → reset à chaque cold start
   - Plusieurs instances Edge Function = plusieurs compteurs indépendants
   - Protection insuffisante contre des attaques coordonnées
   - **Action recommandée** : Utiliser un rate limiter basé sur Redis/DB

6. **Increment de sales_count non-atomique**
   - Pattern `SELECT sales_count → UPDATE sales_count + 1`
   - Race condition possible si deux achats simultanés
   - **Action recommandée** : Utiliser `UPDATE SET sales_count = sales_count + 1`

7. **campaign.current_amount non-atomique**
   - Même pattern que sales_count
   - **Action recommandée** : Utiliser `UPDATE SET current_amount = current_amount + amount`

8. **Pas de retry sur les emails (fire-and-forget)**
   - Les appels `.catch(() => {})` ignorent silencieusement les échecs
   - Pas de queue de retry
   - **Action recommandée** : Implémenter une dead-letter queue ou au minimum logger les échecs

9. **Pas de webhooks Stripe pour les disputes**
   - Seuls `charge.dispute.create/remind/resolve` sont gérés côté Paystack
   - Stripe disputes ne sont pas capturés
   - **Action recommandée** : Ajouter la gestion de `charge.dispute.created` etc. dans stripe-webhook

10. **KYC check dans request-affiliate-payout vérifie le KYC de l'ORG, pas de l'affilié**
    - Un affilié sans KYC personnel peut demander un payout si l'org a son KYC approuvé
    - C'est un choix de design (le KYC est délégué aux processeurs), mais c'est un point d'attention

### 🟢 NOTES

11. **`db` wrapper (`src/lib/db.ts`)**
    - Cast `supabase as any` pour contourner les types auto-générés incomplets
    - Toutes les requêtes DB frontend passent par ce wrapper
    - Pas de type-safety sur les requêtes

12. **Supabase types.ts est read-only**
    - Le fichier `src/integrations/supabase/types.ts` est auto-généré et ne doit jamais être modifié manuellement
    - Les types manuels sont dans `src/types/database.ts` (types custom)

13. **Pas de validation de schéma côté frontend**
    - Les réponses d'Edge Functions ne sont pas validées (pas de Zod runtime validation)
    - Le frontend fait confiance aux données du serveur

---

## 14. Flux de Données Critiques

### Flux 1 : Achat de Produit (Carte → Stripe)

```
Utilisateur → ProductPurchaseModal
    │
    ├── Sélectionne "Carte bancaire"
    ├── PaymentMethodSelector → usePaymentGateway.openPayment()
    │
    ▼
stripe-create-checkout (Edge Fn)
    ├── Auth check (optionnel)
    ├── Load org + product
    ├── Génère reference: SV-STRIPE-{ts}-{random}
    ├── Crée Stripe Checkout Session
    │   ├── metadata: sv_reference, type, org_id, product_id, user_id, affiliate_code
    │   ├── payment_intent_data.metadata (même chose)
    │   └── success_url avec reference + session_id
    └── Retourne checkout_url
    
Stripe Checkout (hosted page)
    │
    ├── Paiement réussi
    │
    ├──→ Stripe redirige vers /payment-success?reference=...&session_id=...&gateway=stripe
    │
    └──→ Stripe envoie webhook POST /stripe-webhook
    
PaymentSuccessPage
    │
    ├── runVerificationLoop() — 8 tentatives
    │   ├── lookupTransaction(reference) — DB lookup
    │   ├── Si pas trouvé : stripe-verify Edge Fn
    │   │   ├── Résout reference depuis session_id si manquant
    │   │   ├── Vérifie Stripe API (payment_status === 'paid')
    │   │   ├── INSERT transaction + fees + affiliates
    │   │   └── Notifications + emails
    │   ├── Wait 1.5s (propagation DB)
    │   ├── lookupTransaction() again
    │   └── Backoff progressif (2s→8s)
    │
    ├── Si trouvé : affiche détails + bouton téléchargement
    └── Si échoué : message "vérifiez Mes Ressources"
    
stripe-webhook (en parallèle)
    ├── Vérifie signature HMAC-SHA256
    ├── Si invalide → fallback fetch event via Stripe API
    ├── Filtre: checkout.session.completed uniquement
    ├── Récupère metadata depuis PaymentIntent
    ├── Idempotence: vérifie paystack_reference unique
    ├── INSERT/UPDATE transaction + fees
    ├── Affiliate sales + partner commissions
    └── Notifications + emails
```

### Flux 2 : Versement Affilié

```
Ambassadeur → /affiliation → "Demander un versement"
    │
    ▼
request-affiliate-payout (Edge Fn)
    ├── Auth + membership
    ├── Freeze check (org)
    ├── KYC check (org level)
    ├── SELECT affiliate_sales WHERE status='pending' AND payable_at < now()
    ├── UPDATE status → 'payable'
    ├── INSERT payout_request (type='affiliate', status='requested')
    ├── Email à l'ambassadeur + admins org
    └── Retourne { payout_request_id, amount }

Superadmin → /superadmin → Approuver le versement
    │
    ▼
process-payout (Edge Fn)
    ├── Auth superadmin
    ├── Vérifie payout.status === 'requested'
    ├── Freeze check (org)
    │
    ├── Si action='reject':
    │   ├── Status → 'rejected'
    │   ├── Revert affiliate_sales → 'payable'
    │   ├── Email de rejet
    │   └── Audit log
    │
    └── Si action='approve':
        ├── Vérifie payable_at de chaque sale (15j minimum)
        ├── Balance check (GET /balance Paystack)
        ├── Si insuffisant → alerte + blocage
        ├── Lookup payout_profiles.paystack_recipient_code
        ├── POST /transfer (Paystack Transfer API)
        ├── Si transfer.status = true:
        │   ├── payout_request → 'paid'
        │   ├── affiliate_sales → 'paid'
        │   ├── Lock recipient (recipient_locked = true)
        │   ├── Notification + email
        │   └── Audit log
        └── Si transfer échoue:
            ├── Audit log (payout_transfer_failed)
            └── Return error (pas de changement de status)
```

---

## 15. Secrets & Configuration

### Secrets Supabase (Edge Functions)

| Secret | Usage | Criticité |
|--------|-------|-----------|
| `STRIPE_SECRET_KEY` | API Stripe (live) | 🔴 Critique |
| `STRIPE_WEBHOOK_SECRET` | Validation webhook Stripe | 🔴 Critique |
| `PAYSTACK_SECRET_KEY` | API Paystack (live) | 🔴 Critique |
| `PAYSTACK_SECRET_KEY_TEST` | API Paystack (test) | 🟡 Dev only |
| `RESEND_API_KEY` | Envoi d'emails | 🟡 Important |
| `ONESIGNAL_REST_API_KEY` | Push notifications | 🟡 Important |
| `VITE_PAYSTACK_MODE` | `live` ou `test` | 🔴 Critique (détermine les clés) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Clé publique Paystack (live) | 🟢 Public |
| `VITE_PAYSTACK_PUBLIC_KEY_TEST` | Clé publique Paystack (test) | 🟢 Public |
| `SUPABASE_URL` | URL du projet | Auto |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin complète | 🔴 Critique |
| `SUPABASE_ANON_KEY` | Clé publique | 🟢 Public |

### Variables d'Environnement Frontend (.env)

| Variable | Valeur | Auto-populée |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | URL Supabase | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | `xzgpzbrgsxtcsktiprik` | ✅ |

### Webhooks à Configurer

| Service | URL | Configuration Requise |
|---------|-----|----------------------|
| Paystack | `https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/paystack-webhook` | Dashboard Paystack → Settings → API Keys & Webhooks |
| Stripe | `https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/stripe-webhook` | Dashboard Stripe → Developers → Webhooks |

### Storage Buckets

| Bucket | Public | Usage |
|--------|--------|-------|
| `public-assets` | ✅ | Assets publics |
| `user-avatars` | ✅ | Avatars utilisateurs |
| `org-uploads` | ✅ | Logos, bannières, images |
| `product-previews` | ✅ | Aperçus produits (premières pages) |
| `private-products` | ❌ | Fichiers produits (accès via URL signée) |
| `kyc-documents` | ❌ | Documents KYC (accès superadmin) |

---

## Annexe A : Fonctions SQL Critiques

```sql
-- Création atomique d'organisation
create_organization_with_owner(_name, _slug, _category, _description, _currency) → UUID

-- Vérification des rôles
is_superadmin(_user_id) → bool
can_admin_org(_user_id, _org_id) → bool
can_manage_org(_user_id, _org_id) → bool

-- Auto-inscription affilié
self_enroll_affiliate(_org_id) → void

-- KYC
submit_org_kyc(...) → jsonb
review_org_kyc(_org_id, _action, _reason) → jsonb

-- Partenaires
attribute_org_to_partner(_org_id, _partner_code) → jsonb
compute_partner_level(_partner_id) → int
get_partner_rate(_partner_id) → numeric

-- Suppression en cascade
delete_organization(_org_id) → jsonb
delete_user_account(_user_id) → void

-- Validation
validate_product_publish() → trigger (empêche publication sans fichier)
prevent_owner_role_change() → trigger (protège le rôle owner)
generate_product_slug() → trigger (slug SEO automatique)
```

---

## Annexe B : Routes Frontend Principales

| Route | Page | Auth Requise |
|-------|------|-------------|
| `/` | Landing page | ❌ |
| `/auth` | Connexion/Inscription | ❌ |
| `/o/:slug` | Page publique organisation | ❌ |
| `/product/:slug/:productSlug` | Détail produit | ❌ |
| `/payment-success` | Confirmation paiement | ❌ (mais auth aide au fallback) |
| `/dashboard` | Tableau de bord utilisateur | ✅ |
| `/affiliation` | Espace ambassadeur | ✅ |
| `/admin/*` | Administration org | ✅ (admin/owner) |
| `/superadmin/*` | Administration plateforme | ✅ (superadmin) |
| `/partner` | Portail partenaire | ✅ |

---

*Fin du document technique. Pour toute question, contactez l'équipe technique Siteviral.*
