# SiteViral Home — Phase 1 MVP Plan

New vertical for on-demand home services (plumbers, electricians, cleaners, movers, painters, AC repair, handymen, gardeners, pest control, appliance repair). Architecture mirrors Beauty 1:1 so we reuse proven patterns (chat-first custom offers, escrow, Dual OTP, extra charges, KYC-gated discovery, anti-bypass trust).

---

## 1. Scope of Phase 1

Ship the same surface area we have for Beauty, adapted to home services:

- Landing `/home` (bilingual FR/EN, mobile-first, Aurora style)
- Discovery `/home/discover` (KYC-gated, category + city filters)
- Provider public page `/home/pro/:slug`
- Client action hub `/home/action` (My requests, Messages, Bookings)
- Provider onboarding `/home/pro/onboarding`
- Provider dashboard `/home/pro` (jobs, revenue, calendar, services)
- Messaging `/home/messages` + `/home/messages/:conversationId` (realtime, anti-bypass)
- Bookings `/home/bookings` + Dual OTP flow (Start/End)
- KYC `/home/pro/kyc` (reuse `IdentityVerificationWizard` with `home` mode)
- Super-App Hub tile + BottomNav vertical-aware routing

Out of scope for Phase 1 (later phases): subscriptions/maintenance plans, team dispatch, parts/materials invoicing beyond extra charges, insurance verification badges.

## 2. Data model (mirror `beauty_*` → `home_*`)

New tables (each: CREATE TABLE → GRANT → ENABLE RLS → POLICY in one migration):

```text
home_providers            user_id, slug, business_name, categories text[],
                          city, country, service_radius_km, bio, cover_url,
                          avatar_url, years_experience, languages text[],
                          status (pending|active|suspended),
                          kyc_status, kyc_verified_at,
                          is_new bool, is_official bool,
                          rating_avg, rating_count,
                          currency, base_call_out_fee, created_at
home_services             provider_id, title, description, category,
                          price_from, price_unit (fixed|hourly|per_m2|quote),
                          duration_minutes, cover_url, active
home_provider_media       provider_id, url, kind (photo|video), sort
home_availability         provider_id, weekday, start_time, end_time
home_availability_blocks  provider_id, starts_at, ends_at, reason
home_conversations        client_id, provider_id, last_message_at
home_messages             conversation_id, sender_id, body, kind
                          (text|offer|system), attachments jsonb
home_chat_violations      (mirror beauty_chat_violations)
home_offers               conversation_id, provider_id, client_id,
                          title, description, price, currency,
                          scheduled_for, address, status
                          (draft|sent|accepted|declined|expired)
home_bookings             offer_id, provider_id, client_id, service_id,
                          address, scheduled_for, price, currency,
                          status (pending|confirmed|en_route|in_progress|
                          completed|cancelled|disputed),
                          start_otp, end_otp, start_otp_verified_at,
                          end_otp_verified_at, escrow_status
home_extra_charges        booking_id, label, amount, currency,
                          status (proposed|accepted|declined|paid)
home_booking_events       booking_id, kind, meta jsonb
home_reviews              booking_id, client_id, provider_id, rating,
                          comment, provider_reply
home_disputes             booking_id, opened_by, reason, status,
                          resolution
home_provider_stats       (denormalized: jobs_completed, revenue_30d, etc.)
```

All follow existing Beauty policies (owner-only writes, public read for active+KYC-verified providers, participants-only for conversations/bookings, service_role for edge functions).

Add `home` to any shared enums used by KYC / chat-violation edge functions.

## 3. Routes

```text
/home                           Landing
/home/discover                  Discovery (KYC-gated list)
/home/pro/:slug                 Public provider page
/home/action                    Client action hub
/home/messages                  Conversations list
/home/messages/:id              Conversation (realtime)
/home/bookings                  Bookings list
/home/booking/:id               Booking detail + Dual OTP
/home/pro/onboarding            Provider onboarding wizard
/home/pro                       Provider dashboard
/home/pro/services              Manage services + pricing
/home/pro/calendar              Availability + blocks
/home/pro/jobs                  Jobs pipeline
/home/pro/revenue               Earnings + payout
/home/pro/kyc                   Identity verification
/home/pro/settings              Profile, radius, currency
/superadmin/home                Moderation (suspend, verify, reports)
```

## 4. UI components (mobile-first, Aurora)

- `HomeLanding`, `HomeLandingBody` (hero, categories grid, trust, CTA)
- `HomeDiscover` (category chips, city filter, distance sort, cards)
- `HomeProviderPublic` (gallery, services, reviews, chat CTA)
- `HomeConversation` (reuse `BeautyConversation` structure — realtime `home_messages`, offer cards, anti-bypass toast)
- `HomeBookingCard` + `HomeDualOtp` (Start/End OTP UI)
- `HomeProDashboard` (KPIs, next job, quick actions) — same layout as `BeautyProDashboard`
- `HomeProviderOnboarding` (categories, service area, first service, KYC prompt)
- Super-App Hub: add "Home Services" tile alongside Digital / Beauty / Church
- `BottomNav`: extend vertical detection to include `/home` and surface `getHomeNavItems(...)` from `actionNavItems.ts`; add "existing provider" query short-circuit like Beauty

## 5. i18n

Add `src/i18n/home.ts` with FR/EN strings for all screens. Wire into `I18nContext`.

Categories list in `src/lib/homeCategories.ts` (plumber, electrician, cleaner, mover, painter, ac_repair, handyman, gardener, pest_control, appliance_repair) with icon + FR/EN label.

## 6. Payments / escrow

Reuse existing GeniusPay + Stripe flow. Escrow entry created on booking confirmation; released on End-OTP verification. Extra charges use the same accepted → paid flow as Beauty. 10% platform commission unchanged. XOF/XAF zero-decimal handling reused.

## 7. Trust & safety

Reuse the Beauty anti-bypass + Gemini violation edge function; only change is table target (`home_chat_violations`) and vertical tag in the prompt. 24h auto-suspension logic reused verbatim.

## 8. Governance / memory

After ship, add a new memory `mem://features/home/vertical-architecture` and update `mem://index.md` Core to mention Home in the verticals line.

## 9. Delivery order (this build)

1. Migration: all `home_*` tables + grants + RLS + policies + realtime publication for `home_messages`, `home_bookings`.
2. i18n file + categories lib.
3. Landing + Discover + Public provider page (read-only surfaces first).
4. Provider onboarding + dashboard shell + KYC route.
5. Conversation + Offers + Bookings + Dual OTP (realtime).
6. Super-App Hub tile + BottomNav vertical wiring.
7. Superadmin `/superadmin/home` moderation stub.

Ship this as one build, then iterate on polish next turn.

## Technical notes

- All new public tables MUST include `GRANT` block in the same migration (authenticated + service_role; anon read on active KYC-verified providers only).
- No CHECK constraints for time-based rules — use validation triggers.
- Realtime subscriptions inside `useEffect` with cleanup.
- No hardcoded colors — use existing Aurora tokens.
- Reuse `IdentityVerificationWizard` with a new `home` mode (copy only difference).

Approve and I ship Phase 1 in the next turn.
