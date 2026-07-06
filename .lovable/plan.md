
# Beauty KYC — reuse the Digital wizard

## Problem

`/settings/kyc` (linked from the Beauty dashboard and public profile owner banner) 404s. Beauty providers have no way to verify identity, so they stay invisible in Explore. The Digital side already has a full KYC pipeline (`IdentityVerificationWizard`, `kyc_submissions`, AI analysis, superadmin review). We reuse it end-to-end instead of building a parallel system.

## Constraints observed in the codebase

- `kyc_submissions.organization_id` is `NOT NULL` with a UNIQUE FK to `organizations` — no beauty_provider_id column today.
- `beauty_providers` is user-scoped (`user_id`), has `kyc_submission_id` and a `status` enum (pending / active…). No `organization_id`.
- `IdentityVerificationWizard` supports `mode: 'org' | 'partner'`. Partner mode calls `submit_partner_kyc` and writes into `partners`, not `kyc_submissions` — not reusable as-is.

## Approach — extend, don't fork

1. **DB migration** (single migration):
   - Add nullable `beauty_provider_id uuid` (unique, FK → `beauty_providers.id` on delete cascade) to `kyc_submissions`.
   - Relax the `organization_id NOT NULL` to nullable and add a CHECK: exactly one of `organization_id` / `beauty_provider_id` is set.
   - New RPC `submit_beauty_kyc(_provider_id, _id_document_url, _id_document_type, _id_document_back_url, _selfie_url, _selfie_with_doc_url, _bank_account_name, _bank_account_number, _bank_name, _payout_method, _payout_phone, _payout_provider)` — mirrors `submit_org_kyc` but scoped to a beauty provider owned by `auth.uid()`. Inserts into `kyc_submissions` with `beauty_provider_id`, `submitted_by = auth.uid()`, `status = 'pending'`, `verification_type = 'individual'`, `kyc_level = 1`; updates `beauty_providers.kyc_submission_id` and does NOT flip `status` to active (superadmin approval does that).
   - RLS: allow provider owner to `SELECT` their own submission (via `beauty_providers.user_id = auth.uid()`); keep existing superadmin policies untouched.
   - Trigger on `kyc_submissions` UPDATE: when a beauty submission is approved, set the linked `beauty_providers.status = 'active'`; when rejected, keep it pending and expose `rejection_reason`.

2. **Frontend — new mode in the wizard**:
   - Add `'beauty'` to `VerificationMode`. Steps: `doc_type → document → selfie → selfie_doc → payout → review` (individual only, no org docs, no "choose type" screen).
   - In `handleSubmit`, branch to `db.rpc('submit_beauty_kyc', …)` when `mode === 'beauty'`.
   - Storage folder: `beauty-kyc/{providerId}` (private bucket, same `kyc-documents` bucket the org flow uses).

3. **New page** `src/pages/beauty/BeautyKYCPage.tsx`:
   - Route `/beauty/pro/kyc` (guarded by `RequireAuth`).
   - Loads `beauty_providers` row for `auth.uid()`. If none → redirect to `/beauty/pro/onboarding`.
   - Loads linked `kyc_submissions` row (status, rejection_reason).
   - Renders `<IdentityVerificationWizard mode="beauty" entityId={provider.id} status={submission?.status ?? 'none'} rejectionReason={submission?.rejection_reason} />`.
   - Reuses the Beauty header/back button pattern from `BeautyProDashboard`.

4. **Route wiring & link fixes**:
   - Register `/beauty/pro/kyc` in the router.
   - Replace every `/settings/kyc` link in `BeautyProDashboard.tsx` (x2) and `BeautyProviderProfile.tsx` (x1) with `/beauty/pro/kyc`.
   - Keep the existing yellow "KYC required for Explore" banner copy — it already reads correctly, only the destination changes.

5. **Superadmin review**:
   - `SuperadminPages.tsx` already lists `kyc_submissions` with `organizations!left(name, category, slug)`. Extend the left-join to also pull `beauty_providers!left(business_name, slug)` and display whichever is present. Approval / rejection actions already write to `kyc_submissions.status`, so the new trigger will propagate to `beauty_providers.status` automatically.

## Out of scope

- No changes to Digital KYC behaviour, org flow, or partner flow.
- No new storage bucket — reuses `kyc-documents`.
- Payout account for beauty providers is captured in the same step as Digital; wiring it to actual GeniusPay/Stripe payout profiles is a follow-up (data is stored on the submission, superadmin sees it).

## Files touched

- `supabase/migrations/<new>.sql` — schema + RPC + trigger + RLS.
- `src/components/verification/IdentityVerificationWizard.tsx` — add `'beauty'` mode branch.
- `src/pages/beauty/BeautyKYCPage.tsx` — new.
- `src/App.tsx` (or wherever beauty routes live) — register route.
- `src/pages/beauty/BeautyProDashboard.tsx`, `src/pages/beauty/BeautyProviderProfile.tsx` — fix `/settings/kyc` links.
- `src/pages/superadmin/SuperadminPages.tsx` — display beauty provider name for beauty submissions.
