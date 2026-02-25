# 🔎 AUDIT INTÉGRAL A→Z — SITEVIRAL
## Version Cabinet International | Février 2026

---

# 🧭 1️⃣ AUDIT PRODUIT — PARCOURS COMPLET

## A. VISITEUR NON CONNECTÉ

### Top 10 Frictions Visiteur

| # | Friction | Lieu | Impact |
|---|---------|------|--------|
| 1 | **Landing → Auth friction** : Le CTA principal "Commencer gratuitement" redirige vers `/auth` sans contexte. Pas de démo, pas de preview. | `src/pages/LandingPage.tsx` → CTA → `/auth` | Abandon immédiat |
| 2 | **Auth confuse** : 3 méthodes (email OTP, magic link, Google) présentées simultanément sans hiérarchie claire. Un visiteur non-tech ne sait pas quoi choisir. | `src/pages/AuthPage.tsx` | Confusion, abandon |
| 3 | **Langue mixte** : Interface FR mais certains labels en anglais ("Sign in", "Loading…", "Submit"). | Multiple composants | Manque de professionnalisme |
| 4 | **Pages légales génériques** : Privacy, Terms, etc. affichent du contenu template sans personnalisation Siteviral. | `src/pages/PrivacyPage.tsx`, `TermsPage.tsx` | Risque légal |
| 5 | **Social proof risqué** : `AnimatedCounter.tsx` avec compteurs qui partent de 0 et s'incrémentent visuellement — impression de faux chiffres. | `src/components/landing/AnimatedCounter.tsx` | Perte de confiance |
| 6 | **Page produit sans preview** : `/product/:id` ne montre pas d'aperçu du contenu digital. Juste titre + prix + bouton. | `src/pages/ProductDetailPage.tsx` | Faible conversion |
| 7 | **Page org publique surchargée** : Tabs (Home, Store, Donate, Content…) sans guidance. Un visiteur ne sait pas où aller. | `src/pages/OrgPublicPage.tsx` | Paralysie du choix |
| 8 | **Pas de breadcrumb** : Navigation en profondeur (Landing → Org → Product → Checkout) sans fil d'Ariane. | Global | Désorientation |
| 9 | **CTA donation sans montants suggérés** : Le modal de don demande un montant libre sans ancrage psychologique. | `src/components/donations/DonateModal.tsx` | Dons plus faibles |
| 10 | **Discover page vide pour guests** : `/discover` sans contenu featured visible sans login. | `src/pages/DiscoverPage.tsx` | Page morte |

---

## B. NOUVEL UTILISATEUR (ZÉRO CONNAISSANCE TECH)

### Top 15 Points de Blocage

| # | Point de Blocage | Lieu | Temps perdu estimé |
|---|-----------------|------|-------------------|
| 1 | **"Slug" dans le formulaire** : Le champ slug dans `CreateOrgPage.tsx` n'est pas compris par les utilisateurs non-tech. | `src/pages/CreateOrgPage.tsx` | 5-10 min |
| 2 | **Pas d'onboarding guidé** : Après signup, l'utilisateur arrive sur `/feed` sans savoir quoi faire. | `src/pages/FeedPage.tsx` | Abandon |
| 3 | **Catégorie obligatoire mal expliquée** : "church", "mosque", "ngo"… sans description de ce que ça implique. | `CreateOrgPage.tsx` | 2-3 min |
| 4 | **Upload logo/banner sans crop guidé** : Le crop dialog existe (`ImageCropDialog.tsx`) mais pas de dimensions recommandées affichées. | `src/components/ui/ImageCropDialog.tsx` | 5 min |
| 5 | **KYC non guidé** : L'utilisateur doit deviner quels documents fournir. Pas de checklist visuelle. | `src/pages/admin/AdminPayouts.tsx` | 15+ min |
| 6 | **Configuration payout complexe** : Bank vs Mobile Money, bank_code, account_number — pas de guidance contextuelle pour la CI. | `src/components/affiliate/AffiliatePayoutSettings.tsx` | 10+ min |
| 7 | **Création produit : champs superflus** : `external_link`, `faq_json`, `testimonials_json`, `upsell_product_ids` affichés pour un premier produit. | `src/pages/admin/AdminProductForm.tsx` | 5 min |
| 8 | **Prix : pas de devise auto-détectée** : L'utilisateur doit manuellement choisir XOF, USD, EUR sans recommendation. | `AdminProductForm.tsx` | 2 min |
| 9 | **Pas de preview "comme le visiteur voit"** : Pas de bouton "Voir ma page" direct dans le dashboard admin. | `src/pages/admin/AdminDashboard.tsx` | Frustration |
| 10 | **Activation monétisation cachée** : `monetization_enabled` doit être activé mais le toggle n'est pas mis en avant. | Organisation settings | 5 min |
| 11 | **Affiliation : concept non expliqué** : Un leader religieux ne sait pas ce qu'est l'affiliation. Pas de tooltip ou guide. | Admin settings | Confusion totale |
| 12 | **Dashboard analytics vide au départ** : Graphiques à 0, pas de message encourageant. | `src/pages/admin/AdminAnalyticsPage.tsx` | Découragement |
| 13 | **Notifications push : setup OneSignal** : Nécessite configuration OneSignal, non guidée. | `src/hooks/usePushNotifications.ts` | Impossible seul |
| 14 | **Email campaigns : Resend setup** : Les emails nécessitent `RESEND_API_KEY` déjà configuré côté serveur, mais l'utilisateur ne sait pas si ça marche. | Edge functions | Invisible |
| 15 | **Programmes/Formations : structure complexe** : Module → Lesson → Quiz — trop de niveaux pour un premier usage. | `src/pages/admin/AdminPrograms.tsx` | 20+ min |

---

## C. VENDEUR / ORGANISATION

### Analyse Clarté Financière

| Aspect | État | Preuve | Verdict |
|--------|------|--------|---------|
| **Net affiché** | ❌ Le vendeur ne voit PAS clairement son net après commission | `AdminAnalyticsPage.tsx` affiche le revenu brut | **CRITIQUE** |
| **Délai 72h** | ⚠️ Mentionné dans le code (`settlement_status: 'held'`) mais pas dans l'UI vendeur | `verify-payment/index.ts` L.199 | **À CORRIGER** |
| **Commission plateforme** | ⚠️ `platform_fee_percent` dans `organizations` table mais pas visible dans l'UI vendeur | DB: `organizations.platform_fee_percent` | **MANQUANT** |
| **Commission affilié** | ⚠️ Visible dans les logs mais pas dans un tableau clair | `affiliate_sales` table | **INSUFFISANT** |
| **Historique payouts** | ✅ Table `payout_requests` avec statut | `AdminPayouts.tsx` | OK |

### UX Vendeur — Problèmes Majeurs

1. **Pas de simulation revenus** : Impossible de voir "Si je vends à 5000 XOF, je reçois X"
2. **Pas d'export factures** : `pdfExport.ts` existe mais génère des rapports, pas des factures conformes
3. **Dashboard : métriques brutes** : Pas de comparaison période précédente
4. **Pas de notification "Votre paiement a été envoyé"** : Le vendeur ne sait pas quand il est payé

---

## D. ACHETEUR

### Analyse Friction Achat

| Étape | État | Preuve |
|-------|------|--------|
| **Achat produit** | ✅ Fonctionnel via Paystack | `ProductPurchaseModal.tsx` → `usePaystack.ts` |
| **Achat via affilié** | ✅ Attribution cookie 30j | `useAffiliateCapture.ts` |
| **MoMo CI** | ✅ Paystack supporte Mobile Money | Config Paystack |
| **Email confirmation** | ✅ Via `send-email` edge function | `verify-payment/index.ts` L.386 |
| **Téléchargement** | ✅ Signed URL via `generate-signed-url` | Edge function |
| **Preuve d'achat** | ⚠️ Email seulement, pas de facture PDF | `send-email-helper.ts` |
| **Refund** | ❌ **NON IMPLÉMENTÉ** côté applicatif | Aucun endpoint refund |
| **Dispute** | ⚠️ Webhook Paystack `charge.dispute.create` géré | `paystack-webhook/index.ts` |
| **Gestion erreurs paiement** | ⚠️ Message générique "Payment not successful" | `verify-payment/index.ts` L.107 |

### Points Critiques Acheteur
1. **Pas de page "Mes achats"** dédiée avec historique complet
2. **Pas de re-téléchargement facile** : Doit retrouver l'email ou naviguer dans les resources
3. **Pas de confirmation visuelle post-paiement** : Redirect vers `/payment-success` mais page basique
4. **Pas de support chat** : Contact page seulement

---

## E. AFFILIÉ — Audit Technique Complet

### Flux Complet Affilié

```
1. Activation   → self_enroll_affiliate() DB function
2. Lien créé    → affiliate_links table, code = SLUG-USERID
3. Cookie       → useAffiliateCapture.ts (localStorage, 30j)
4. Clic tracké  → affiliate_attributions table
5. Achat        → verify-payment/index.ts L.158-174
6. Commission   → affiliate_sales table, status='pending'
7. payable_at   → Date.now() + 15 jours (L.265)
8. Request      → request-affiliate-payout edge function
9. Recipient    → create-transfer-recipient edge function
10. Payout      → process-payout edge function
11. Hold 15j    → payable_at check dans request-affiliate-payout
```

### Vérifications Sécurité Affilié

| Check | État | Preuve |
|-------|------|--------|
| **Anti self-referral** | ✅ `affLink.user_id !== userId` | `verify-payment/index.ts` L.167 |
| **Anti owner-affiliate** | ✅ `_org.owner_id = _caller` blocked | `self_enroll_affiliate()` DB function |
| **Attribution non contournable** | ⚠️ Cookie-based, localStorage clearable | `useAffiliateCapture.ts` |
| **Double payout** | ✅ Idempotency check `existingAffiliateSale` | `verify-payment/index.ts` L.258-262 |
| **payable_at sécurisé** | ✅ Calculé server-side | `verify-payment/index.ts` L.265 |
| **Solde vérifié avant payout** | ✅ Check dans `request-affiliate-payout` | Edge function |
| **Freeze bloque payout** | ✅ `is_frozen` check | `request-affiliate-payout` |
| **Multi-device abuse** | ❌ **NON PROTÉGÉ** : Même user, différents devices | Aucune protection device fingerprint |
| **Dispute bloque commission** | ⚠️ Dispute change `settlement_status` mais pas `affiliate_sales.status` directement | Gap potentiel |

### Risques Affilié Identifiés

1. **Cookie localStorage** : Effaçable, pas de fallback server-side
2. **Pas de device fingerprinting** : Un affilié pourrait acheter via un autre device
3. **Commission % fixe par org** : Pas de tiers par produit (ex: 5% sur produit A, 15% sur produit B)
4. **Pas de plafond commission** : Un affilié pourrait gagner des montants disproportionnés

---

## F. SUPERADMIN / COMPLIANCE

### Capacités Superadmin

| Action | Implémenté | Lieu |
|--------|-----------|------|
| Suspension org | ✅ `is_active = false` | `organizations` table + admin UI |
| Freeze payout | ✅ `is_frozen` sur `affiliate_links` | DB + admin |
| Dispute webhook | ✅ `charge.dispute.create` | `paystack-webhook/index.ts` |
| Fraud flags | ✅ `fraud_flags` table | DB + `SuperadminRiskAML.tsx` |
| Audit logs | ✅ `audit_logs` table | DB |
| Export CSV | ✅ `csvExport.ts` | `src/lib/csvExport.ts` |
| Export PDF | ✅ `pdfExport.ts` (print-based) | `src/lib/pdfExport.ts` |
| RLS coverage | ⚠️ Partielle | Voir section sécurité |

### Vérification Isolation Données

- **RLS `organizations`** : Lecture publique pour pages publiques, écriture restreinte owner/admin ✅
- **RLS `donations`** : Accessible par org members + donor ✅
- **RLS `product_purchases`** : Accessible par org members + buyer ✅
- **RLS `profiles`** : ⚠️ **TROP PERMISSIF** — `SELECT` potentiellement trop ouvert
- **RLS `kyc_submissions`** : ✅ Restreint owner/admin + superadmin
- **RLS `payout_requests`** : ✅ Restreint user + org admin

---

# 🏦 2️⃣ AUDIT FINANCIER

## Diagramme Flux Argent

```
ACHETEUR paie 10,000 XOF via Paystack
         │
         ▼
    ┌─────────────────────────┐
    │      PAYSTACK           │
    │                         │
    │  Paystack fee (~1.5%)   │
    │  = ~150 XOF             │
    └──────┬──────────────────┘
           │
    Split automatique (Subaccount)
           │
    ┌──────┴──────────────────┐
    │                         │
    ▼                         ▼
┌──────────┐         ┌──────────────┐
│ SITEVIRAL │         │  SUBACCOUNT  │
│ (Main)    │         │  (Vendeur)   │
│           │         │              │
│ Platform  │         │ Net vendeur  │
│ fee 10%   │         │ = 8,850 XOF  │
│ = 1,000   │         │              │
│           │         │ Settlement:  │
│ + Affil.  │         │ MANUAL       │
│ commission│         │ Hold 72h     │
│ (si appl.)│         │              │
└──────────┘         └──────────────┘
    │
    │ Si affilié (10% commission):
    │
    ▼
┌──────────────┐
│ AFFILIÉ      │
│ Commission   │
│ = 1,000 XOF  │
│ Hold 15 jours│
│ Via Transfer │
│ API          │
└──────────────┘
```

### Vérifications Financières

| Vérification | État | Preuve |
|-------------|------|--------|
| Subaccount 1:1 | ✅ Via `create-paystack-subaccount` | Edge function |
| settlement_schedule manual | ✅ `settlement_schedule: 'manual'` | Edge function param |
| transaction_charge correct | ✅ `platformFee + affiliateCommission` | `verify-payment/index.ts` L.176 |
| No transit brut vendeur | ✅ Split payment direct | Subaccount architecture |
| Commission affilié calculée | ✅ `amountPaid * commPct / 100` | `verify-payment/index.ts` L.171 |
| Solde vérifié avant payout | ✅ Check dans edge function | `request-affiliate-payout` |
| transfer.failed webhook | ⚠️ Non explicitement géré | Gap dans `paystack-webhook` |
| Dispute bloque payout | ✅ `settlement_status = 'disputed'` | Webhook handler |
| bank_code CI validé | ⚠️ Via Paystack API mais pas de validation locale | Risque erreur user |

---

# 🗃 3️⃣ AUDIT BASE DE DONNÉES

## Tables Sensibles

| Table | Données Sensibles | RLS | Risque |
|-------|-------------------|-----|--------|
| `profiles` | `bank_*`, `phone`, `email` | ⚠️ Trop permissif | **ÉLEVÉ** |
| `kyc_submissions` | Documents identité, coordonnées bancaires | ✅ Restreint | Moyen |
| `donations` | Montants, emails donateurs | ✅ | Faible |
| `product_purchases` | Montants, user_id | ✅ | Faible |
| `payout_requests` | Montants, coordonnées bancaires | ✅ | Faible |
| `affiliate_sales` | Commissions | ✅ | Faible |
| `fraud_flags` | Données investigation | ✅ Superadmin only | Faible |
| `audit_logs` | Actions utilisateurs | ✅ | Faible |
| `contacts` | Emails, phones CRM | ⚠️ À vérifier | **MOYEN** |

## Index Manquants Potentiels

| Table | Colonne(s) | Raison |
|-------|-----------|--------|
| `donations` | `(organization_id, created_at)` | Requêtes dashboard |
| `product_purchases` | `(organization_id, created_at)` | Requêtes dashboard |
| `affiliate_sales` | `(affiliate_user_id, status)` | Page affilié |
| `media_content` | `(organization_id, is_published, created_at)` | Listing public |
| `user_notifications` | `(user_id, is_read, created_at)` | Badge notifications |
| `client_events` | `(event_name, created_at)` | Analytics |
| `content_comments` | `(content_id, content_type)` | Chargement commentaires |

## Champs Potentiellement Redondants

- `donations.donor_email` vs `profiles.email` (quand `user_id` est renseigné)
- `digital_products.sales_count` vs `COUNT(product_purchases)` (dénormalisation OK pour perf)
- `affiliate_links.total_earned` vs `SUM(affiliate_sales.commission_amount)` (idem)

---

# 🔐 4️⃣ AUDIT SÉCURITÉ

## Top 10 Vulnérabilités Potentielles

| # | Vulnérabilité | Sévérité | Lieu | Recommandation |
|---|--------------|----------|------|----------------|
| 1 | **Bucket `org-uploads` PUBLIC** contenant KYC documents | 🔴 CRITIQUE | Storage config | Passer en privé, utiliser signed URLs |
| 2 | **RLS `profiles` trop permissif** : données bancaires exposées | 🔴 CRITIQUE | `profiles` table | Restreindre SELECT aux colonnes non-sensibles |
| 3 | **Pas de HMAC verification webhook Paystack** | 🟠 HAUTE | `paystack-webhook/index.ts` | Vérifier signature `x-paystack-signature` |
| 4 | **Rate limiting basique in-memory** : reset au redéploiement | 🟠 HAUTE | `verify-payment/index.ts` L.5-16 | Utiliser rate limiting DB ou Redis |
| 5 | **Edge functions `verify_jwt = false`** sur TOUTES les fonctions | 🟠 HAUTE | `supabase/config.toml` | Activer JWT sur fonctions authentifiées |
| 6 | **Cookie affilié en localStorage** : manipulable | 🟡 MOYENNE | `useAffiliateCapture.ts` | Ajouter validation server-side |
| 7 | **Pas de CSP headers** | 🟡 MOYENNE | Global | Ajouter Content-Security-Policy |
| 8 | **`SUPABASE_SERVICE_ROLE_KEY` dans edge functions** : OK si bien utilisé | 🟡 MOYENNE | Edge functions | Vérifier qu'il n'est jamais exposé côté client |
| 9 | **Signed URLs : durée d'expiration** non configurée explicitement | 🟡 MOYENNE | `generate-signed-url` | Définir expiration courte (1h max) |
| 10 | **Pas de validation CORS stricte** : `Access-Control-Allow-Origin: *` | 🟡 MOYENNE | Toutes edge functions | Restreindre aux domaines Siteviral |

---

# 🌍 5️⃣ AUDIT STRATÉGIQUE

## Scalabilité à 10,000 Organisations

| Aspect | Limite Estimée | Où ça casse | Solution |
|--------|---------------|-------------|----------|
| **Dashboard analytics** | ~500 orgs | Requêtes `SUM()` directes sur `donations`/`purchases` | Migrer vers `org_daily_metrics` (table existe, sous-utilisée) |
| **Listing Discover** | ~1000 orgs | Requêtes full-table scan | Pagination cursor-based + index |
| **Upload vidéo** | ~100 simultanés | Multipart upload standard | TUS protocol (resumable) |
| **Notifications temps réel** | ~5000 users | Supabase Realtime channels | OK, Supabase gère bien |
| **Edge functions cold start** | ~2000 req/min | Deno cold starts | OK avec Supabase scaling |
| **Emails transactionnels** | ~10000/jour | Resend rate limits | Queuing system |

## Où le Support Explosera

1. **KYC** : Utilisateurs ne comprenant pas les documents requis
2. **Payouts** : "Pourquoi je n'ai pas reçu mon argent ?"
3. **Affiliation** : "Ma commission n'est pas correcte"
4. **MoMo** : Échecs de paiement mobile money (réseau)

## Blocages Psychologiques Leaders Religieux

1. **"Affiliation"** : Terme perçu comme du marketing agressif → Renommer "Parrainage" ou "Ambassadeur"
2. **"Commission"** : Connotation négative religieuse → Renommer "Contribution de remerciement"
3. **"Produit digital"** : Trop commercial → "Ressource" ou "Contenu"
4. **"Analytics"** : Intimidant → "Tableau de bord" ou "Vue d'ensemble"
5. **KYC** : "Pourquoi vous voulez mes documents ?" → Expliquer la conformité

## Risques Presse

1. **"Plateforme qui prend 10% aux églises"** → Communication proactive sur la valeur ajoutée
2. **"Données KYC dans un bucket public"** → Fix immédiat obligatoire (P0)
3. **"Affiliation sur les dons religieux"** → Éthiquement questionnable, à cadrer

---

# 📊 6️⃣ SYNTHÈSE OPÉRATIONNELLE

## (1) Top 25 Problèmes Classés

### P0 — Blockers (Fix immédiat)

| # | Problème | Impact |
|---|---------|--------|
| 1 | Bucket `org-uploads` PUBLIC avec KYC | Fuite données identité |
| 2 | RLS `profiles` expose données bancaires | Violation RGPD |
| 3 | Pas de vérification HMAC webhook Paystack | Fraude potentielle |
| 4 | `verify_jwt = false` sur toutes les edge functions | Appels non authentifiés |
| 5 | Refund non implémenté | Obligation légale |

### P1 — Critique (Avant launch scale)

| # | Problème | Impact |
|---|---------|--------|
| 6 | Pas de net affiché au vendeur | Frustration, support |
| 7 | Rate limiting in-memory only | Contournable |
| 8 | Pas de device fingerprinting affilié | Fraude commission |
| 9 | `transfer.failed` webhook non géré | Perte d'argent silencieuse |
| 10 | Pas de montants suggérés donation | Dons plus faibles |
| 11 | Auth page confuse (3 méthodes) | Abandon signup |
| 12 | Onboarding inexistant post-signup | Churn immédiat |
| 13 | CORS `*` sur toutes les edge functions | Sécurité |
| 14 | Pas de simulation revenus vendeur | Incompréhension |
| 15 | Dashboard vide sans encouragement | Découragement |

### P2 — Important (Avant 1000 orgs)

| # | Problème | Impact |
|---|---------|--------|
| 16 | Analytics basé sur requêtes directes | Performance |
| 17 | Slug technique dans formulaires | UX |
| 18 | Pas de breadcrumb navigation | Désorientation |
| 19 | KYC non guidé | Support élevé |
| 20 | Pages légales template | Risque légal |
| 21 | Pas de facture PDF acheteur | Compliance |
| 22 | Commission affilié fixe par org | Flexibilité |
| 23 | Programmes trop complexes | Abandon création |
| 24 | Pas de re-téléchargement facile | Support |
| 25 | Social proof compteurs suspects | Confiance |

---

## (2) 15 Quick Wins (≤2h dev chacun)

| # | Quick Win | Effort | Impact |
|---|----------|--------|--------|
| 1 | Passer `org-uploads` en privé + signed URLs | 30 min | 🔴 Sécurité |
| 2 | Ajouter montants suggérés donation (1000, 5000, 10000 XOF) | 30 min | 💰 Conversion |
| 3 | Renommer "Slug" → "Lien personnalisé" avec auto-génération | 20 min | 🎯 UX |
| 4 | Ajouter tooltip/guide sur "Affiliation" → "Programme Ambassadeur" | 30 min | 🎯 UX |
| 5 | Afficher commission % dans le dashboard vendeur | 45 min | 💡 Clarté |
| 6 | Ajouter empty state encourageant sur dashboard vide | 30 min | 😊 Rétention |
| 7 | Hiérarchiser auth : Google en premier, email en second | 20 min | 🎯 Conversion |
| 8 | Ajouter "Voir ma page" bouton dans admin | 15 min | 🎯 UX |
| 9 | Bannière "Complétez votre profil" avec progression % | 45 min | 📈 Activation |
| 10 | Ajouter HMAC verification webhook Paystack | 1h | 🔐 Sécurité |
| 11 | Traduire tous les labels anglais restants | 1h | 🌍 Qualité |
| 12 | Ajouter dimensions recommandées sur upload image | 15 min | 🎯 UX |
| 13 | Page `/payment-success` avec récapitulatif complet | 1h | 😊 Confiance |
| 14 | CORS restreint aux domaines Siteviral | 30 min | 🔐 Sécurité |
| 15 | Renommer "Analytics" → "Tableau de bord" | 5 min | 🎯 Accessibilité |

---

## (3) 15 Must-Fix Avant Scale

| # | Must-Fix | Complexité | Justification |
|---|---------|-----------|---------------|
| 1 | Implémenter refund flow complet | 2-3j | Obligation légale |
| 2 | Migrer analytics vers `org_daily_metrics` triggers | 2j | Performance à scale |
| 3 | Device fingerprinting anti-fraude affilié | 1-2j | Protection revenus |
| 4 | Gérer `transfer.failed` et `transfer.reversed` webhooks | 1j | Intégrité financière |
| 5 | RLS granulaire sur `profiles` (colonnes sensibles) | 1j | RGPD |
| 6 | Onboarding wizard post-signup complet | 2-3j | Rétention |
| 7 | Factures PDF conformes (acheteur + vendeur) | 2j | Compliance |
| 8 | Rate limiting persistent (DB-based) | 1j | Sécurité |
| 9 | JWT verification sur edge functions authentifiées | 1j | Sécurité |
| 10 | Commission affilié par produit | 1j | Flexibilité business |
| 11 | Simulateur revenus vendeur | 1j | Transparence |
| 12 | Upload resumable (TUS) pour gros fichiers | 2j | Fiabilité Afrique |
| 13 | Queue emails (éviter rate limits Resend) | 1-2j | Fiabilité |
| 14 | Monitoring/alerting (erreurs edge functions) | 1j | Opérations |
| 15 | Multi-langue structurée (i18n complet) | 3-5j | International |

---

## (4) Ce Qu'il Faut Supprimer

| Élément | Raison |
|---------|--------|
| `AnimatedCounter` avec faux chiffres | Perte de confiance |
| Méthode "Magic Link" dans auth (garder Google + OTP) | Simplification |
| Champs avancés produit en première création | Overwhelming |
| `useDirectoryMode.ts` | ✅ Déjà supprimé |
| Compteurs sociaux non vérifiés sur landing | Risque crédibilité |

---

## (5) Ce Qu'il Faut Ajouter

| Élément | Priorité | Justification |
|---------|----------|---------------|
| Onboarding wizard 3 étapes | P1 | Activation |
| Simulateur revenus "Combien je gagne" | P1 | Conversion vendeur |
| Refund management | P0 | Légal |
| Factures PDF | P1 | Compliance |
| Monitoring Sentry/alerting | P1 | Opérations |
| Page "Mes achats" dédiée acheteur | P1 | UX |
| Système de tickets support in-app | P2 | Support |
| Webhooks sortants pour intégrations | P2 | Ecosystem |
| API publique documentée | P3 | Ecosystem |
| Programme "Ambassadeur" rebrandé | P1 | Adoption |

---

## (6) Go / No-Go

| Critère | Verdict | Condition |
|---------|---------|-----------|
| **Architecture technique** | ✅ GO | Solide, bien structurée |
| **Flux financier** | ✅ GO | Subaccount split correct |
| **Sécurité** | 🔴 NO-GO | Bucket KYC public + RLS profiles |
| **UX vendeur** | ⚠️ GO conditionnel | Après onboarding + clarté financière |
| **UX acheteur** | ✅ GO | Fonctionnel, améliorable |
| **Compliance** | 🔴 NO-GO | Pas de refund, KYC public |
| **Scalabilité** | ⚠️ GO conditionnel | Après migration analytics |

### **VERDICT GLOBAL : GO CONDITIONNEL**

Conditions non-négociables avant scale :
1. ✅ Bucket `org-uploads` privé
2. ✅ RLS `profiles` renforcé
3. ✅ Refund flow implémenté
4. ✅ HMAC webhook verification

---

## (7) Les 5 Risques Majeurs Invisibles

| # | Risque | Probabilité | Impact | Invisibilité |
|---|--------|------------|--------|-------------|
| 1 | **Insolvabilité technique** : Les commissions affiliés sont transférées depuis le compte principal Siteviral. Si le volume augmente, le cash flow du compte principal peut être négatif entre les encaissements Paystack et les payouts affiliés. | Moyenne | 🔴 Fatal | Le code ne vérifie pas le solde global du compte principal |
| 2 | **Fraude affilié coordonnée** : Un réseau d'affiliés pourrait créer des achats circulaires (A achète via le lien de B, B achète via le lien de A) pour générer des commissions. L'anti-self-referral ne couvre pas ce cas. | Moyenne | 🟠 Élevé | Aucune détection de patterns circulaires |
| 3 | **Liability KYC** : Siteviral collecte des documents d'identité sans être un établissement financier agréé. En cas de fuite (bucket public !), la responsabilité légale est énorme. | Élevée (bucket public) | 🔴 Fatal | Aucun DPO, pas de politique de rétention |
| 4 | **Dépendance Paystack unique** : Tout le flux financier dépend de Paystack. Si Paystack suspend le compte (compliance, volume suspect), toute la plateforme s'arrête. Pas de provider backup. | Faible | 🔴 Fatal | Pas de plan B |
| 5 | **Réglementation religieuse** : Dans certains pays, collecter de l'argent au nom d'organisations religieuses nécessite des autorisations spécifiques. Siteviral pourrait être considéré comme facilitant la collecte non autorisée. | Moyenne | 🟠 Élevé | Pas de vérification du statut légal des organisations |

---

# 💼 VERDICT INVESTISSEUR

## Si j'étais un VC, investirais-je ?

### **OUI, avec conditions.**

**Pour :**
- ✅ Architecture technique solide et moderne (React + Supabase + Edge Functions)
- ✅ Modèle économique clair (commission plateforme + split payment)
- ✅ Marché sous-servi (organisations religieuses Afrique francophone)
- ✅ Monétisation multiple (produits, dons, affiliation, subscriptions)
- ✅ Mobile-first (PWA + bottom nav)
- ✅ Paystack integration mature avec subaccounts

**Contre :**
- 🔴 Vulnérabilités sécurité critiques (KYC public, RLS)
- 🔴 Pas de refund = risque légal
- 🟠 Onboarding inexistant pour cible non-tech
- 🟠 Pas de monitoring/alerting production
- 🟠 Single point of failure (Paystack)

**Conditions d'investissement :**
1. Fix sécurité P0 dans les 48h
2. Refund flow dans les 2 semaines
3. Onboarding wizard dans le mois
4. Embaucher un DPO / compliance officer
5. Plan B paiement (Stripe, Flutterwave)

**Valorisation estimée :** Early stage, pré-revenus significatifs → Round seed si les conditions sont remplies.

---

*Rapport généré le 25 février 2026*
*Audit réalisé sur la base du code source, de la configuration Supabase, et de l'architecture déployée.*
