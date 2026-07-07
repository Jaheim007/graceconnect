# SiteViral Modular — Phase 5

## Pre-flight verification (already done)

Ran SQL against the 250+ existing orgs:

- 106 orgs are `digital_products` (all existing orgs; other verticals are user-based, not org-based)
- Every org has 10–11 features in `enabled_features` (legacy baseline ∪ type defaults ∪ detected usage)
- 105 orgs are unconfirmed → non-blocking welcome modal will show on next login
- No org has fewer features than the legacy baseline → sidebar filtering cannot remove anything they previously reached

Since verticals like Beauty/Church/Home run on user-level provider rows (not on `organizations`), those cohorts are untouched by anything we do here.

## The safety rule (non-negotiable)

Filtering only ever hides a nav item / public section when **all three** are true:

1. Current org has a confirmed SiteViral type (`type_confirmed_at IS NOT NULL`)
2. Feature is not in the org's `enabled_features`
3. The nav item is actually gated by a feature key (many top-level items — Sales, Wallet, KYC, Payouts, Settings — are never gated)

If any check fails → item is shown. This means: existing unconfirmed orgs see everything they used to see, no exceptions.

Nav items **always shown regardless of features**:
- Mes ventes & revenus, Wallet, KYC, Payouts, Settings, Sign out, Superadmin, Discover, My purchases, My organizations

Nav items **eligible for gating** (only hidden when feature is off AND type confirmed):
- Écrire un livre → `ai_book_creation`
- Créer une formation → `ai_formation_creation`
- Vendre → `digital_products`
- Gagner (affiliation) → `affiliation`

## Phase 5.1 — Sidebar filtering (safe)

Add a `featureKey?: SiteviralFeatureKey` field to `ActionNavItem` (optional). In `Sidebar.tsx`, filter with the safety rule above via `useOrgFeatures`. No item is ever hidden when the user has no `currentOrg` or when `type_confirmed_at` is null.

## Phase 5.2 — Public page section gating

The public org page (`OrgPage.tsx` / vertical landing pages) already renders sections unconditionally. Wrap the four feature-tied sections in `<FeatureGate feature="..." showWhileLoading>`:

- Digital products grid → `digital_products`
- Donation block → `donation_gifts`
- Events section → `events`
- Reviews block → `reviews`

Same safety: `FeatureGate` checks `has(key)` against `enabled_features`. For any org backfilled with the legacy baseline, nothing disappears.

## Phase 5.3 — New-user onboarding

For brand-new orgs (created after this ships, `features_confirmed_at IS NULL` AND no legacy data), route through:

1. `/onboarding/type` — pick one of the 5 available types (church, digital_products, beauty, artisans_home_services, tutors_home_teachers)
2. On submit: write `siteviral_type`, `enabled_features = defaults_for_type`, timestamps, and audit row in `feature_activations`
3. Redirect to `/admin`

Existing orgs skip onboarding entirely (they already have `enabled_features` populated + see the welcome modal).

Detection: brand-new = org row age < 5 minutes OR `enabled_features` empty. Hook this into `DashboardRouter.tsx`.

## Phase 5.4 — Naming pass

- Rename user-facing labels of `AdminFeaturesPage` header from "Fonctionnalités" → "Fonctionnalités SiteViral"
- Retire "Events" from the type picker (already `available: false` for sport/instrumentists/influencers/services — Events is a feature, not a type — already correct in config)
- Add a "Bientôt" chip next to unavailable types in the picker (already implicit; make explicit)
- FR/EN copy pass on `UpgradeMigrationModal` and `AdminFeaturesPage`

## Cannot verify per-cohort with live login

I don't have access to log in as a real Digital Products / Church / Beauty user. The SQL verification above is the strongest guarantee I can give:

- No enabled_features array shrank
- Every legacy dashboard route stays reachable (safety rule keeps it visible even if the key is missing)
- No data table (products, sales, wallet, KYC, payouts, affiliate) is touched — this phase only reads `organizations.enabled_features` and adds UI filters

If you can share test-account credentials I'll drive Playwright through the flows before shipping wider.

## Files touched

- `src/lib/navigation/actionNavItems.ts` — add optional `featureKey`
- `src/components/layout/Sidebar.tsx` — safe filter
- `src/pages/OrgPage.tsx` (or equivalent) — wrap sections in `FeatureGate`
- `src/pages/DashboardRouter.tsx` — new-user redirect
- `src/pages/onboarding/OnboardingTypePage.tsx` — new
- `src/App.tsx` — route
- `src/pages/admin/AdminFeaturesPage.tsx` — copy pass
- `src/components/siteviral/UpgradeMigrationModal.tsx` — copy pass

## Out of scope

- Renaming Vendre / Écrire un livre / etc. (user hasn't asked)
- Removing Beauty/Church/Home/Education/Events dedicated apps
- Any DB migration (schema is stable from Phase 1)
