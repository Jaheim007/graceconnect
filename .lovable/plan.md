# SiteViral Church — Plan

A dedicated vertical (like Beauty) built specifically for churches. Not a template on top of orgs — its own onboarding, dashboard, discovery, and public church page. Africa-first with a strong diaspora bridge (MoMo for locals, card/Stripe for members abroad).

## 1. Product pillars (v1)

1. **Sermon audio library** — weekly audio uploads, streamable, sellable or free, auto transcription.
2. **AI audio → content** — one sermon audio becomes: ebook chapter, blog article, WhatsApp devotional, reel script, sermon notes PDF.
3. **Tithes & offerings** — recurring + one-time giving, campaigns with goals, receipts, diaspora card payments.
4. **Community & events** — members list, prayer requests inbox, Sunday service schedule, live embed (YouTube/FB).

Everything else (small groups, attendance, courses, etc.) → v2 backlog.

## 2. Public surfaces

```text
/church                        Vertical landing (mission + CTA)
/church/discover               Browse verified churches (map + list)
/church/:slug                  Public church page (sermons, giving, events, prayer)
/church/:slug/sermon/:id       Sermon player + AI-generated content tabs
/church/:slug/give             Dedicated giving page (tithe, offering, campaigns)
/church/:slug/campaign/:id     Campaign with goal bar + share
/church/onboarding             Church owner setup wizard
/church/pro                    Church admin dashboard
/church/pro/sermons            Sermon manager (upload, AI transform, publish)
/church/pro/giving             Giving dashboard (donors, recurring, payouts)
/church/pro/events             Events + live stream
/church/pro/prayer             Prayer inbox
/church/pro/members            Members + diaspora segment
/church/pro/kyc                KYC (reuse IdentityVerificationWizard, `church` mode)
/church/pro/settings           Branding, currency, payout, custom domain
```

Public church page layout (mobile-first): hero (logo/cover/service times) → Give CTA → Latest sermon (audio player) → Sermons grid → Upcoming events → Prayer request form → Location.

## 3. Data model (new tables)

```text
church_providers        similar to beauty_providers: user_id, slug, name, bio,
                        cover_url, logo_url, address, lat/lng, service_times,
                        denomination, languages[], currency, status,
                        kyc_submission_id, verified
church_sermons          church_id, title, description, audio_url, duration_s,
                        transcript, series, preacher, scripture_refs[],
                        is_free, price, currency, published_at
church_sermon_variants  sermon_id, type (ebook|blog|whatsapp|reel|notes_pdf),
                        content (jsonb), status, generated_by_model, cost_credits
church_campaigns        church_id, title, description, goal_amount, currency,
                        raised_amount, cover_url, ends_at, status
church_events           church_id, title, starts_at, ends_at, location,
                        stream_url, is_recurring, recurrence_rule
church_prayer_requests  church_id, requester_name?, requester_contact?,
                        message, is_private, status (new|reading|prayed|closed)
church_members          church_id, user_id, role (member|leader|pastor),
                        joined_at, country (for diaspora segment)
```

**Reuse existing tables**: `offerings` + `offering_transactions` for tithes/offerings; `donation_campaigns`/`donations` for campaigns; `kyc_submissions` extended with `church_provider_id` (same pattern as beauty).

RLS: owner + org leaders can write; public read on published sermons/events/campaigns; prayer requests private by default (only church staff read).

Storage: `church-media` (public — sermon audio, covers), `church-kyc` (private, reuses `kyc-documents` folder pattern).

## 4. AI audio → content pipeline

Edge function `church-transform-sermon`:

1. Client uploads sermon audio to `church-media`.
2. Function calls Lovable AI STT (`openai/gpt-4o-mini-transcribe`) with streaming → stores `transcript` on the sermon.
3. On owner request per variant type, calls `google/gemini-3-flash-preview` with a tone-locked prompt (Christian teaching, no character invention, cite scripture refs literally) to produce:
   - Ebook chapter (structured markdown)
   - Blog article (SEO title + meta + body)
   - WhatsApp devotional (≤600 chars, 1 verse)
   - Reel script (30s hook + 3 beats + CTA)
   - Sermon notes PDF (outline + key verses + application questions)
4. Each variant costs credits (respects `ai-content-and-credits-governance`). Church owner reviews and publishes.

## 5. Payments & diaspora bridge

- Local giving: **GeniusPay** MoMo (Orange, MTN, Wave) in XOF/XAF/GHS/KES.
- Diaspora giving: **Stripe** card + Apple/Google Pay, converts to church's home currency for display but settles in giver's currency (per `currency-and-zero-decimal-logic` — no auto-conversion at checkout).
- Recurring tithes: Stripe subscriptions for card, GeniusPay standing order where supported.
- Payout: standard SiteViral payout rules (10,000 XOF min, MoR, 3–15 days, KYC required).
- Every gift → automatic bilingual receipt email; recurring donor gets year-end statement.

## 6. Discovery & verification

- `/church/discover`: filter by country, city, denomination, language, service time.
- Only **KYC-verified** churches appear in discovery (same rule as Beauty).
- Unverified churches: public URL works but `noindex`, dashboard shows yellow banner with CTA to `/church/pro/kyc`.

## 7. Dashboard (mobile-first, Aurora-inspired)

`/church/pro` — same visual language as new Beauty dashboard: sidebar on desktop, bottom nav on mobile, KPI cards (weekly gifts, active donors, this Sunday's sermon plays, prayer inbox count), quick actions (Upload sermon, Launch campaign, Post announcement).

Sections match `/church/pro/*` routes above. All strings via `useI18n` FR/EN.

## 8. Phased delivery

**Phase 1 — Foundation (this build)**
- DB migration (church_* tables, RLS, grants, kyc extension, storage buckets).
- Onboarding wizard + provider profile create.
- Church admin dashboard shell + KYC page (reuse wizard with `church` mode).
- Public church page (hero, sermons list, give CTA, events, prayer form).
- `/church` landing + `/church/discover`.

**Phase 2 — Sermons + AI**
- Sermon upload + audio player + transcript.
- `church-transform-sermon` edge function + variants UI.
- Sermon monetization (free / paid, reuses digital_products flow).

**Phase 3 — Giving**
- Offerings + campaigns bound to church_provider (adapt existing donation flows).
- Recurring tithe (Stripe subscription + GeniusPay).
- Donor dashboard + receipts + year-end statement job.

**Phase 4 — Community**
- Prayer request inbox with private/public toggle.
- Events + live embed.
- Members segmentation (local vs diaspora) for targeted campaigns.

**Phase 5 — Polish**
- SEO (JSON-LD Church schema, sitemap per church, canonical).
- Native app tab (Capacitor already in place).
- Custom subdomain (reuses wildcard proxy infra).

## 9. Open decisions (before Phase 2)

- Denomination taxonomy: pick a fixed list (Pentecostal, Catholic, Protestant, Evangelical, Orthodox, Other) or free text? Fixed list improves discovery filters.
- Sermon paywall: pastor-level default (all free vs paid), or per-sermon toggle only?
- Prayer requests: allow anonymous submissions, or require email/phone for follow-up?
- AI variants: auto-generate all 5 on upload (costs ~X credits per sermon) or on-demand per variant (cheaper, more clicks)?

## Technical notes (for me, the builder)

- Follow `beauty_providers` architecture 1:1 to keep the codebase symmetrical (`IdentityVerificationWizard` gets a `church` mode alongside `beauty`).
- Reuse `beautyCategories.ts` pattern → `churchDenominations.ts`.
- Extend `kyc_submissions` with `church_provider_id` (nullable) + XOR CHECK with existing `organization_id` / `beauty_provider_id`; new RPCs `submit_church_kyc`, `review_church_kyc`; trigger flips `church_providers.status = 'active'` on approval.
- All new public tables: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY` in the same migration.
- Bilingual copy files: `src/i18n/church.ts` (FR/EN) — never hardcode strings.
- Naming per `standard-naming-conventions`: "Église"/"Church", "Prédication"/"Sermon", "Dîme"/"Tithe", "Offrande"/"Offering", "Campagne"/"Campaign".
