# SiteViral Church — MVP Plan (aligned with your ChatGPT spec)

Your spec is strong. It matches what we already scaffolded, with **one critical correction** vs the previous plan:

> **KYC blocks payout only — not page creation, sermons, AI, discovery, prayer, or collecting money.**

That single rule reshapes the flow. We'll rewrite the gates accordingly and treat KYC as a *payout verification* step, not a *visibility* step.

---

## 1. Correction to what's already built

Current code gates discovery + public page + giving on `status = 'active'` (KYC-approved). Rework:

- `church_providers.status`: keep `pending | active | suspended` but interpret differently
  - `pending` (default on create) → **visible in discovery + public page + can receive giving**
  - `active` → same, plus **payout enabled**
  - `suspended` → hidden everywhere
- Add badges on `church_providers`:
  - `is_new` (auto: created <30d)
  - `payout_verified` (bool, mirrors KYC approved)
  - `is_official` (bool, superadmin manual)
- Public page + `/church/discover`: show all non-suspended churches, render badge chips.
- Dashboard banner: "You can receive payments now. Complete payout verification before withdrawing funds." with CTA to `/church/pro/kyc` when `payout_verified = false`.
- `/church/pro/kyc` renamed **Payout Verification** in UI (keep route).

## 2. Data model (add / adjust)

Already have: `church_providers`, `church_sermons`, `church_sermon_variants`, `church_campaigns`, `church_events`, `church_prayer_requests`, `church_members`.

Add:

```text
church_announcements     church_id, title, body, cover_url,
                         published_at, status (draft|published), pinned
church_team_members      church_id, user_id, role (owner|admin),
                         invited_by, invited_at, accepted_at
church_content_reports   church_id, reporter_user_id?, reason,
                         message, status (new|reviewing|actioned|dismissed)
church_receipts          transaction_id, church_id, donor_email,
                         donor_name?, amount, currency, giving_type,
                         reference, sent_at, pdf_url
```

Adjust `church_providers`: add `payout_verified bool default false`, `is_official bool default false`, `social_links jsonb`, `default_language text`.

Adjust `church_sermons`: add `series text`, `tags text[]`, `transcription_status` (`pending|transcribing|ready|failed`), `transcript_language text`, `unclear_sections jsonb` (array of `{start_s, end_s, note}`).

Adjust `church_sermon_variants`: add `approval_status` (`draft|approved|published`), `edited_by`, `edited_at`. Types: `transcript|summary|notes|whatsapp|ebook|reel`.

Reuse: `offering_transactions` for giving (add `giving_type` enum: `tithe|offering|donation|campaign` + `church_id` FK), `donation_campaigns` linked to `church_id`.

All new tables: `CREATE TABLE` → `GRANT` (authenticated + service_role; anon read on published announcements/events/sermons) → `ENABLE RLS` → `POLICY` in the same migration.

## 3. AI pipeline — safety-first prompts

Edge functions:

1. `church-transcribe-sermon` — STT via `openai/gpt-4o-mini-transcribe`, streams tokens, writes transcript + `unclear_sections` (model flags low-confidence spans, never guesses).
2. `church-generate-variant` — one-per-type, on-demand only (cheaper). Uses `google/gemini-3-flash-preview` with a locked system prompt:
   - Preserve the preacher's exact message and doctrine
   - Never invent scripture, testimonies, prophecies, names
   - Quote scripture references literally (verify against a passed list of refs)
   - Output structured JSON per variant type
   - Always mark `approval_status = 'draft'`

Nothing publishes until the church admin approves.

## 4. Routes

```text
/church                          Landing
/church/discover                 Public discovery (no KYC gate)
/church/:slug                    Public page (no KYC gate)
/church/:slug/sermon/:id         Sermon player + AI content tabs
/church/:slug/give               Giving (tithe/offering/donation)
/church/:slug/campaign/:id       Campaign detail
/church/:slug/events             Events list
/church/onboarding               Create church (no KYC)
/church/pro                      Dashboard
/church/pro/sermons              Sermon manager + AI outputs
/church/pro/products             Publish PDFs/audio as digital products
/church/pro/giving               Giving inbox + payout balance
/church/pro/campaigns            Campaign manager
/church/pro/events               Events + announcements
/church/pro/prayer               Prayer inbox
/church/pro/announcements        Announcements
/church/pro/team                 Invite admins (owner/admin only)
/church/pro/kyc                  Payout Verification
/church/pro/settings             Profile, giving, payout, language
/superadmin/church               Moderation (suspend, verify, reports)
```

## 5. Dashboard cards (mobile-first, Aurora)

Profile completion · Latest sermon plays · Prayer requests count · Total giving (this month) · Payout balance + payout verification status · Recent transactions · Recent prayer requests. Quick actions: Upload sermon, Generate content, Edit page, Create campaign, View giving, View prayer requests, Complete payout verification.

## 6. Giving flow (no KYC to receive)

- Public `/church/:slug/give` → pick type (Tithe / Offering / Donation / Campaign) → amount + currency → email (for receipt) + optional name → GeniusPay (MoMo, XOF/XAF/GHS/KES) or Stripe (card, diaspora).
- Webhook creates `offering_transactions` row with `giving_type` + `church_id`, generates `church_receipts` PDF, emails donor.
- Balance accrues to church regardless of KYC. Withdraw button on `/church/pro/giving` is disabled when `payout_verified = false` with the exact copy: "Complete payout verification to withdraw your funds."

## 7. Content moderation

- Every public church page + sermon has a "Report" button → `church_content_reports`.
- Superadmin `/superadmin/church`: list churches, filter by status/reports, actions: verify official, suspend, un-suspend, resolve report.
- Upload confirmation checkbox on sermon upload: "I confirm I have permission to upload and publish this church content."

## 8. Notifications

Reuse `user_notifications` + email. Events: transcription done, AI variant ready, new prayer request, new giving received, receipt sent, payout verification needed / approved / rejected, campaign donation received. Channels: in-app + email.

## 9. Team access (MVP)

`church_team_members` with `owner | admin`. Owner invites via email, admin gets same dashboard access minus billing/payout settings. Deeper roles (finance, media, prayer, editor, pastor approval) → v2.

## 10. Phased delivery

**Phase 1 (this next build) — Fix the gates + core surfaces**
- Migration: rework status semantics, add `payout_verified` / `is_official` / `is_new`, drop KYC checks from discovery + public page + giving, add announcements + team + reports + receipts tables.
- Update `ChurchDiscover`, `ChurchPublicProfile`, `ChurchProDashboard` to remove KYC-blocking + show badges + payout banner.
- `/church/pro/kyc` copy → "Payout Verification".

**Phase 2 — Sermons + AI**
- Sermon upload with rights-confirmation checkbox.
- `church-transcribe-sermon` edge fn + transcript editor with unclear-section highlights.
- `church-generate-variant` edge fn + variants UI (summary, notes PDF, WhatsApp, ebook draft).
- Sermon library public + admin.

**Phase 3 — Giving + Campaigns + Digital Products**
- `/church/:slug/give` + GeniusPay/Stripe webhooks + `church_receipts` PDF + email.
- Campaigns with goal bar + share.
- Publish sermon audio / PDFs as digital products (reuse `digital_products`).

**Phase 4 — Community**
- Prayer inbox + statuses.
- Announcements + Events (with optional live stream URL).
- Team invites.

**Phase 5 — Trust & polish**
- Superadmin moderation console + reports queue.
- Notifications wiring.
- SEO (JSON-LD Church schema, sitemap per church).
- Verified Payout / Official badges rendering everywhere.

## 11. Open decisions (quick answers needed before Phase 2)

1. **Denomination**: fixed list (Pentecostal, Catholic, Protestant, Evangelical, Orthodox, Other) or free text? *Recommend fixed list for filters.*
2. **AI variants**: on-demand per type (cheaper, matches spec) or auto-generate all on upload? *Recommend on-demand.*
3. **Prayer requests**: allow fully anonymous (no email) or require contact? *Spec says optional — recommend optional.*
4. **Sermon paywall**: per-sermon free/paid toggle only, or church-wide default? *Recommend per-sermon toggle.*

## Technical notes

- All strings via `useI18n` (FR/EN) in `src/i18n/church.ts`.
- Follow `beauty_providers` architecture 1:1 minus the KYC-gate-on-visibility.
- Every new public-schema table: `CREATE TABLE → GRANT → ENABLE RLS → CREATE POLICY` in one migration.
- Reuse `IdentityVerificationWizard` `church` mode; only change is dashboard copy ("Payout Verification") + banner.
- Currency: keep `currency-and-zero-decimal-logic` (XOF/XAF no ×100).
- Payments: GeniusPay for MoMo, Stripe for diaspora — no Paystack.

Approve this and I'll ship Phase 1 (gate rework + new tables + updated UI) in the next turn.
