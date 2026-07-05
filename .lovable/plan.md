# SiteViral Beauty — MVP Build Plan

## Flow fix (do first)
Mirror the Digital pattern. Right now `/beauty` opens the long marketing page. Change to:

- `/beauty` → **BeautyActionHub** (Gojek-style "What do you want to do?" screen) with the marketing landing rendered underneath (scroll to learn more).
- `/beauty/about` → the pure marketing landing (for footer links, ads, SEO).
- Bottom nav on `/beauty/*` already swaps to Beauty items — keep it.

The BeautyActionHub tiles (client-side, adapt if signed-in-as-pro):
1. **Explorer les pros** → `/beauty/search`
2. **Mes réservations** → `/beauty/bookings` (auth-gated)
3. **Messages** → `/beauty/messages` (auth-gated)
4. **Devenir pro** → `/beauty/pro/onboarding`
5. **Espace pro** (visible if user has a `beauty_provider` row) → `/beauty/pro`

## MVP scope — what a first real user can do end-to-end

### Client journey
1. Land on `/beauty`, tap **Explorer**.
2. **Search & discover** (`/beauty/search`) — filter by category, city, price range, rating, "à domicile / en salon". List view with provider cards (photo, name, rating, starting price, city).
3. **Provider profile** (`/beauty/p/:slug`) — gallery, services list with prices/duration, availability calendar, reviews, "Réserver" CTA.
4. **Booking wizard** (`/beauty/book/:serviceId`) — 3 steps: pick slot → pick mode (full escrow / 20% deposit) → pay (Paystack MoMo / Stripe). Contact info stays masked until confirmation.
5. **Booking confirmation** (`/beauty/bookings/:id`) — status timeline, chat with pro, cancel/dispute buttons.
6. **After service** — client taps "Confirmer la prestation", funds release to pro, review form unlocks (rating + optional tip 0–20%).

### Provider journey
1. `/beauty/pro/onboarding` (already exists, 4 steps).
2. **Provider dashboard** (`/beauty/pro`) — today's bookings, revenue this week, unread messages, quick "block a slot" action.
3. **My services** (`/beauty/pro/services`) — CRUD on `beauty_services` (title, price, duration, description, photo).
4. **My availability** (`/beauty/pro/availability`) — weekly recurring hours + one-off blocks.
5. **My bookings** (`/beauty/pro/bookings`) — list, accept/decline, mark as done.
6. **My messages** (`/beauty/pro/messages`) — thread list + realtime chat.
7. **My payouts** (`/beauty/pro/payouts`) — reuse existing `payout_profiles` + `manual_payouts`.

### Superadmin
- `/superadmin/beauty` — providers pending approval, active bookings, disputes queue, top providers by GMV. Reuse existing superadmin shell + `audit_logs`.

## Data layer — what's already there vs what's missing

**Already migrated (Phase A):** `beauty_providers`, `beauty_services`, `beauty_availability`, `beauty_availability_blocks`, `beauty_bookings`, `beauty_booking_events`, `beauty_conversations`, `beauty_messages`, `beauty_reviews`, `beauty_disputes`.

**Missing / to add:**
- `beauty_provider_stats` (materialized-ish table refreshed by trigger: total_bookings, avg_rating, response_time_avg, completion_rate) — needed for ranking.
- Slot-generator SQL function `beauty_get_available_slots(provider_id, service_id, date_from, date_to)` — combines weekly availability + blocks + existing bookings.
- Realtime enabled on `beauty_messages`, `beauty_bookings`, `beauty_booking_events`.
- Trigger to auto-open a `beauty_conversation` when a booking is created.
- Trigger to lock reviews until `booking.status = 'completed'`.
- Escrow bookkeeping: booking gets `platform_fee_cents`, `provider_amount_cents`, `held_until` timestamp; auto-release job (edge function cron) after 24h post-completion.
- Storage bucket `beauty-media` (public read, provider write on own path).

## Business rules (MVP defaults — tunable in `platform_settings`)
- Platform commission: **10%** on the service amount.
- Deposit mode: **20%** of price non-refundable if client no-shows; 100% refunded if pro no-shows.
- Auto-release: **24h** after client confirmation (or auto-confirmed at H+24 after scheduled end).
- Cancellation: free >24h before slot; 50% fee within 24h; 100% within 2h.
- Cash-on-arrival mode: **disabled by default** for MVP.
- Contact info (phone, whatsapp, address) masked in chat until booking is `paid` or `deposit_paid`.
- Reviews only allowed on `completed` bookings; 1 review per booking.

## Build phases (proposed order)
1. **B0 — Flow fix + missing schema.** BeautyActionHub, route rewires, `beauty_provider_stats`, slot function, realtime, storage bucket. *~1 pass.*
2. **B1 — Search & profile.** `/beauty/search` + `/beauty/p/:slug` + availability calendar read. *~1 pass.*
3. **B2 — Booking flow.** Wizard + escrow-aware Paystack/Stripe checkout (reuse existing routers) + confirmation page. *~1 pass.*
4. **B3 — Chat + realtime.** Conversation list, thread UI, message compose, contact-masking rule. *~1 pass.*
5. **B4 — Provider dashboard.** All `/beauty/pro/*` pages. *~1 pass.*
6. **B5 — Reviews, tips, auto-release cron.** Review form, tip flow, edge function `beauty-autorelease` (scheduled). *~1 pass.*
7. **B6 — Superadmin console + polish.** *~1 pass.*

## Out of scope for MVP (deliberately deferred)
- In-app video calls, home-service safety flow (SOS button), recurring appointments, provider teams/employees, loyalty points, dynamic pricing, waitlists per slot, multi-language beyond FR/EN, ads/boosts for pros.

## Open questions before B0
1. Currency for pricing: **XOF only at launch**, or allow each pro to price in their local currency (GHS/KES/…)?
2. Booking modes at launch: **Full escrow + 20% deposit**, or ship only full escrow first to keep it simple?
3. Do we require KYC before a provider can accept bookings, or allow "receive bookings now, KYC before first payout"?

## Technical notes (for the record)
- All new tables: standard GRANTs (`authenticated`, `service_role`), RLS-scoped by `provider.user_id` or `booking.client_id`.
- Follow the existing `.beauty-scope` design tokens (rose/gold) — no hardcoded colors.
- Bilingual FR/EN via `useI18n` — no exceptions.
- Reuse `useDisplayCurrency`, `usePaymentGateway`, `KycGuard`, `payout_profiles`, existing edge functions for Paystack/Stripe checkout. Extend, don't duplicate.
