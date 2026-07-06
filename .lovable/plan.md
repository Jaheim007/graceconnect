# SiteViral Events — Phase 1 MVP Plan

Fourth vertical on SiteViral. Same architecture as Beauty and Home: chat-first custom offers, 100% escrow, Dual OTP, extra charges, KYC-gated discovery, anti-bypass trust. Adapted for event-day services where bookings are scheduled weeks/months in advance with deposits.

---

## 1. Scope of Phase 1

Ship the same surface area as Home, adapted for events:

- Landing `/events`
- Discovery `/events/discover` (category + city + event date filters)
- Public provider page `/events/pro/:slug` (portfolio-heavy)
- Client action hub `/events/action`
- Provider onboarding `/events/pro/onboarding`
- Provider dashboard `/events/pro` (upcoming events, revenue, packages)
- Messaging `/events/messages` (realtime + anti-bypass)
- Bookings `/events/bookings` + `/events/booking/:id` with **Dual OTP on event day** (Start = arrival, End = wrap)
- KYC `/events/pro/kyc` (reuse `IdentityVerificationWizard` in `events` mode)
- Superadmin `/superadmin/events`
- Super-App Hub tile + vertical-aware routing

**Events-specific tweaks vs Home**:
- Categories: Photographer, Videographer, DJ, MC/Animator, Caterer, Decorator, Venue, Sound & Light, Security, Traiteur, Planner, Rental (chairs/tables/tents)
- Packages instead of hourly services (`events_packages` with duration + guest capacity)
- Portfolio gallery is central (media grid on public page)
- Deposit-first escrow: partial upfront + balance on event day
- Event date + venue address are first-class booking fields

Out of scope: multi-vendor bundling, ticketing, guest RSVP, insurance/permits.

## 2. Data model (mirror `home_*` → `events_*`)

New tables, each following CREATE → GRANT → RLS → POLICY:

```text
events_providers          user_id, slug, business_name, categories text[],
                          city, country, service_radius_km, bio, cover_url,
                          avatar_url, years_experience, languages text[],
                          status, kyc_status, kyc_verified_at,
                          is_new, is_official, rating_avg, rating_count,
                          currency, min_deposit_pct
events_packages           provider_id, title, description, category,
                          price, duration_hours, guest_capacity,
                          included jsonb, cover_url, active
events_provider_media     provider_id, url, kind (photo|video), sort
events_availability_blocks provider_id, starts_at, ends_at, reason
events_conversations      client_id, provider_id, last_message_at
events_messages           conversation_id, sender_id, body, kind
                          (text|offer|system), attachments jsonb
events_chat_violations    (mirror home_chat_violations)
events_offers             conversation_id, provider_id, client_id,
                          title, description, price, currency,
                          deposit_amount, event_date, venue_address,
                          guest_count, status
events_bookings           offer_id, provider_id, client_id, package_id,
                          event_date, venue_address, guest_count,
                          price, deposit_paid, balance_due, currency,
                          status (pending|confirmed|deposit_paid|
                          in_progress|completed|cancelled|disputed),
                          start_otp, end_otp, start_otp_verified_at,
                          end_otp_verified_at, escrow_status
events_extra_charges      booking_id, label, amount, currency, status
events_booking_events     booking_id, kind, meta jsonb
events_reviews            booking_id, client_id, provider_id, rating,
                          comment, provider_reply
events_disputes           booking_id, opened_by, reason, status
events_provider_stats     events_completed, revenue_30d, upcoming_count
```

All follow proven Beauty/Home RLS patterns.

## 3. Routes

```text
/events                       Landing
/events/discover              Discovery
/events/pro/:slug             Public provider page (portfolio)
/events/action                Client hub
/events/messages              Conversations
/events/messages/:id          Conversation
/events/bookings              Bookings list
/events/booking/:id           Booking detail + deposit + Dual OTP
/events/pro/onboarding        Provider onboarding
/events/pro                   Dashboard
/events/pro/packages          Manage packages
/events/pro/revenue           Earnings
/events/pro/kyc               KYC
/superadmin/events            Moderation
```

## 4. Edge functions

- `events-create-booking` — creates booking + deposit checkout (GeniusPay/Stripe)
- `events-otp` — generate Start/End OTPs
- `events-verify-booking` — verify OTP + release funds
- `events-extra-charge` — propose/accept extra charges
- Extend `geniuspay-webhook` to route `events_*` orders

## 5. Cross-cutting

- Bilingual FR/EN keys in `useI18n` for all Events copy — use **"Prestataire"** in FR, **"Vendor"** in EN (per user preference: no "pro" wording repeated)
- 10% platform commission (existing rule)
- XOF zero-decimal handling (existing engine)
- Payout profile reused across verticals
- Add `events` to Super-App Hub + BottomNav vertical detection

## 6. Delivery order

1. Migration (all `events_*` tables + realtime publication + RLS)
2. Edge functions + `geniuspay-webhook` extension
3. Provider side: onboarding → dashboard → packages → KYC → revenue
4. Client side: landing → discover → public page → chat → offer → booking → deposit → Dual OTP → review
5. Superadmin `/superadmin/events` panel
6. Hub tile + route wiring in `App.tsx`

Proceed?
