
# SiteViral Modular Foundation — Build Plan

Goal: build the **PRD foundation** — one platform, one org row driven by `siteviral_type` + `enabled_features[]`. No new verticals. Existing Beauty / Church / Home / Digital / Learn / Events code stays; we wrap it behind feature flags so dashboards and public pages become adaptive. Naming and cosmetic renames come **after** the foundation works.

## What "foundation" means here
Four building blocks. Everything else in the PRD (onboarding wording, Add-More UI, migration modal, etc.) plugs into these.

```text
1. Data model      → organizations gains siteviral_type + enabled_features[]
2. Config layer    → single source of truth for the 9 types × 13 features
3. Runtime gate    → useEnabledFeatures + <FeatureGate> everywhere
4. Migration       → non-destructive backfill for 250+ existing orgs
```

## Phase 1 — Data model (migration)

Add to `organizations`:
- `siteviral_type text` (nullable until user picks; enum enforced in app)
- `enabled_features text[] not null default '{}'`
- `features_confirmed_at timestamptz` (null = existing user hasn't confirmed migration yet)
- `type_confirmed_at timestamptz`

New audit table `feature_activations(org_id, feature_key, activated_by, activated_at, source)` with GRANT + RLS (org managers read/insert, service_role all).

Backfill in the same migration:
- Every existing org → `siteviral_type = 'digital_products'`, `features_confirmed_at = null` (so the migration modal shows on next login).
- `enabled_features` seeded from what the org actually uses today, detected via existence in `digital_products`, `donations`, `beauty_providers`, `church_providers`, `home_providers`, `education_tutors`, `events`, `affiliate_links`, `kyc_submissions`, `product_reviews`, `content_comments`. This guarantees no user loses a feature.

## Phase 2 — Config layer

`src/lib/siteviral/types.ts` — the 9 types + labels (FR/EN) + default features from PRD §19.
`src/lib/siteviral/features.ts` — the 13 feature keys, FR/EN labels, descriptions (for Add-More page), icon, and the route/component they gate.
`src/lib/siteviral/matrix.ts` — the ✅/— matrix from PRD §6 so we can render "Recommended for your type" chips.

Zero UI change in this phase — pure data.

## Phase 3 — Runtime gate

- `useOrgFeatures(orgId)` hook → returns `{ type, features: Set<FeatureKey>, has(key), isLoading }`.
- `<FeatureGate feature="events">…</FeatureGate>` wrapper component.
- Sidebar nav items in `Sidebar.tsx` filtered by `has(key)`.
- Public org page sections wrapped in `FeatureGate`.
- `Add More Functionalities` page at `/admin/features` listing every feature not currently on, one-click activate → writes to `organizations.enabled_features` + `feature_activations` audit row. Uses default-recommendation from the matrix to sort.

## Phase 4 — Onboarding + migration flow

- New user: after signup + `create-org`, redirect to `/onboarding/type` (pick one of 9) → `/onboarding/goals` (checkbox list pre-checked with type defaults) → writes `siteviral_type`, `enabled_features`, `type_confirmed_at`, `features_confirmed_at`.
- Existing user: `AppLayout` checks `currentOrg.features_confirmed_at == null` → mount `<UpgradeMigrationModal>` (blocking, dismissible only via completion). FR/EN copy from PRD §9. Default = `digital_products` but user can pick any of the 9. On confirm: merge existing detected features with the type's defaults, set both `_confirmed_at` timestamps.

## Phase 5 — Naming pass (last, cosmetic)

Only after Phases 1–4 work end-to-end:
- Rename user-facing labels ("SiteViral Church", "SiteViral Beauty", etc.).
- Retire Events as a standalone vertical entry point (it becomes a `feature`, not a type). Existing `/events` routes stay live; they just no longer appear in the type picker.
- Hide unimplemented types (Sport, Instrumentists, Influencers, Services) from the picker with "Bientôt disponible" until we build their pages.

## Delivery order (what I'll ship, in this order)

1. **Migration + backfill** (Phase 1) — one `supabase--migration` call.
2. **Config files + hook + FeatureGate + Add More page** (Phases 2–3) — one code batch.
3. **Onboarding + Migration modal** (Phase 4) — one code batch.
4. **Sidebar + public page wiring** — one code batch.
5. **Naming + hide unbuilt types** (Phase 5) — one small batch.

I stop after each step for you to preview before continuing.

## Technical section (skip if not interested)

- No new tables besides `feature_activations`. Feature membership lives on the org row for read speed — `enabled_features text[]` gives us O(1) client checks and cheap GIN index for admin queries.
- `siteviral_type` stays `text` not enum, so adding types later doesn't require a migration.
- Detection SQL for backfill uses `EXISTS` sub-queries per feature, wrapped in a single `UPDATE organizations` with a computed `array_remove(array[...], null)`.
- `FeatureGate` renders `null` by default when the feature is off — no flicker.
- Migration modal is a portal inside `AppLayout`, gated on `!isLoadingOrgs && currentOrg && !currentOrg.features_confirmed_at`.
- No edge function changes needed for Phase 1–3. Phase 4 might add one small `siteviral-confirm-type` function only if we want server-side audit of the migration event.

Ready to start with Phase 1 (the migration). Confirm and I'll open it.
