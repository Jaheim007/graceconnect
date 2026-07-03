# SiteViral Beauty — MVP Build Plan

A booking marketplace for beauty services in Abidjan, running as a **vertical inside SiteViral** (reusing auth, KYC, payouts, GeniusPay/Paystack/Stripe, disputes, notifications, ambassador system). It introduces its own routes, schema, chat, calendar, and escrow logic.

---

## 1. Product scope (MVP)

**Two sides:**
- **Clients** — browse providers, book with deposit or full escrow, chat, review.
- **Providers** — publish services, manage calendar, chat, receive payouts after completion.

**Three booking modes** (per service, provider chooses which they accept):
1. **Full escrow** — client pays 100% online, held until "service completed" confirmation.
2. **Deposit / Reserve** — client pays 20% on-platform, balance in cash at appointment.
3. **Cash on arrival** — no money on platform (only offered to providers with high trust score; disabled by default at launch).

**Core rules (from your strategy):**
- No contact info / external payment shared before booking is confirmed.
- Reviews unlocked only after a paid or deposit booking.
- Provider payout only after client "completed" confirmation OR auto-release J+3 (72h).
- Refunds/disputes = manual arbitration by superadmin (reuse existing dispute shell).
- 50/50 no-show split.
- Optional **tip** at review time (0% commission).
- Commission: same 10% platform base as SiteViral core (configurable per category).

---

## 2. Routes & pages

**Public / client side** (`/beauty/*`)
```
/beauty                          Landing (hero, categories, top providers, how it works)
/beauty/search                   Search + filters (category, zone, price, availability, rating)
/beauty/provider/:slug           Provider profile (services, gallery, reviews, calendar)
/beauty/service/:id              Service detail + booking CTA
/beauty/book/:serviceId          Booking flow (slot → mode → payment)
/beauty/checkout/success         Post-payment confirmation
/beauty/bookings                 Client's bookings dashboard
/beauty/bookings/:id             Booking detail + chat + status actions
/beauty/messages                 Inbox (all conversations)
```

**Provider side** (`/beauty/pro/*`, gated by `beauty_provider` role)
```
/beauty/pro/onboarding           KYC + profile + service setup wizard
/beauty/pro/dashboard            KPIs (bookings, revenue, response time, rating)
/beauty/pro/services             CRUD services & pricing modes
/beauty/pro/calendar             Availability grid + booked slots
/beauty/pro/bookings             Booking queue (pending, upcoming, completed)
/beauty/pro/messages             Inbox
/beauty/pro/reviews              Reviews received + reply
/beauty/pro/payouts              Reuse existing payout profile flow
```

**Superadmin** (extend `/superadmin`)
```
/superadmin/beauty/providers     KYC review, suspend, trust score
/superadmin/beauty/bookings      Live bookings, disputes queue
/superadmin/beauty/disputes      Arbitration workspace
/superadmin/beauty/reviews       Fake-review flags
```

---

## 3. Data model (new tables, all under `public`, with GRANTs + RLS)

```
beauty_providers          (user_id, business_name, slug, bio, zones[], home_service_ok,
                           trust_score, response_time_avg_min, avg_rating, total_bookings,
                           status: pending|active|suspended, kyc_submission_id)
beauty_services           (provider_id, category, title, description, duration_min,
                           price_xof, allow_full_escrow, allow_deposit, deposit_pct,
                           allow_cash, at_salon, at_home, images[], active)
beauty_availability       (provider_id, weekday, start_time, end_time)  -- weekly template
beauty_availability_blocks(provider_id, starts_at, ends_at, reason)     -- vacation/exception
beauty_bookings           (id, service_id, provider_id, client_id, slot_start, slot_end,
                           location_type: salon|home, address, mode: escrow|deposit|cash,
                           price_xof, deposit_xof, commission_xof, tip_xof,
                           status: pending_payment|confirmed|in_progress|completed
                                  |cancelled|no_show|disputed|refunded,
                           payment_intent_id, gateway, created_at, confirmed_at,
                           completed_at, auto_release_at)
beauty_booking_events     (booking_id, actor_id, event_type, payload, created_at)  -- audit
beauty_conversations      (id, booking_id NULL, client_id, provider_id, last_message_at)
beauty_messages           (conversation_id, sender_id, body, redacted_body,
                           contains_contact_attempt, created_at, read_at)
beauty_reviews            (booking_id UNIQUE, client_id, provider_id, rating 1-5,
                           title, body, tip_xof, provider_reply, created_at)
beauty_disputes           (booking_id, opened_by, reason, evidence[], status,
                           resolution, resolved_by, resolved_at)
beauty_provider_stats     (provider_id, day, bookings_count, revenue_xof, no_shows,
                           avg_response_min)  -- materialized daily
```

Reuse existing: `kyc_submissions`, `payout_profiles`, `manual_payouts`, `refund_requests`, `moderation_actions`, `user_notifications`, `audit_logs`.

---

## 4. Escrow & payout flow

```
client pays → payment_events row → booking.status = confirmed
      ↓
   appointment happens
      ↓
   client marks "completed"  OR  72h auto-release after slot_end
      ↓
   funds move from escrow ledger → provider payout balance
      ↓
   provider requests payout via existing SiteViral payout system
```

Cancellation matrix:
- Client cancels >24h before: full refund minus gateway fee.
- Client cancels <24h: 50% to provider, 50% refund.
- Provider cancels: full refund + trust score penalty.
- No-show (client): 50/50 split, requires provider proof (photo/GPS ping).
- Dispute: funds frozen until superadmin arbitrates.

---

## 5. Chat & anti-leak

- Realtime via Supabase Realtime on `beauty_messages`.
- Server-side redaction (edge function) before insert:
  - Phone/email/WhatsApp regex → replaced with `[masked]` in `redacted_body`.
  - Flag `contains_contact_attempt` for moderation.
- Client sees `redacted_body` until booking is confirmed & paid; then full `body` is revealed.
- Rate limiting + spam score to prevent flood.

---

## 6. Calendar

- Weekly availability template + exception blocks.
- Slot generator RPC returns bookable 30-min slots for a given service/day, subtracting existing bookings and blocks.
- Provider view: week grid; client view: next-14-days flat list per service.

---

## 7. Ranking signals (search)

Weighted score:
- Avg rating (30%)
- Total completed bookings (20%)
- Response time (20%)  ← your addition
- Trust score / KYC level (15%)
- Recency of activity (10%)
- Zone match (5%)

---

## 8. Reuse map (don't rebuild)

| Beauty need | Reuse from SiteViral |
|---|---|
| Auth, roles | `user_platform_roles` + new `beauty_provider` role |
| KYC | `kyc_submissions` |
| Payments | Existing Paystack + Stripe routers |
| Payouts | `payout_profiles`, `manual_payouts` |
| Refunds | `refund_requests` |
| Notifications | `user_notifications`, bilingual email engine |
| Ambassadors | Existing attribution (referral of clients & providers) |
| Superadmin shell | Extend `/superadmin` with Beauty section |
| i18n | `useI18n` FR/EN |
| Design tokens | Existing semantic tokens |

---

## 9. Build phases

**Phase A — Foundations (schema + roles + shell)**
- Migrations for all `beauty_*` tables with GRANTs and RLS.
- `beauty_provider` role + role check helpers.
- `/beauty` landing + navigation entry.
- Provider onboarding wizard (KYC → profile → first service).

**Phase B — Discovery & profiles**
- Search + filters + provider profile + service detail.
- Availability template + slot generator RPC.
- Public provider gallery + reviews display.

**Phase C — Booking & escrow**
- Booking flow (slot → mode → payment via existing gateways).
- Escrow ledger + auto-release cron edge function (J+3).
- Cancellation matrix + refund path.
- Booking dashboards (client & provider).

**Phase D — Chat**
- Conversations + messages + realtime.
- Redaction edge function + reveal-on-confirm.
- Inbox UI both sides.

**Phase E — Reviews, tips, ranking**
- Post-booking review flow with optional tip.
- Ranking score RPC + search integration.
- Provider reply to reviews.

**Phase F — Superadmin Beauty console**
- Providers KYC queue, bookings monitor, disputes workspace, reviews moderation.
- Trust score adjustments + suspension actions.

**Phase G — Polish**
- Provider stats page (response time, revenue, cohort).
- Notification templates FR/EN for all lifecycle events.
- Empty states, loading skeletons, mobile-first pass, dark mode audit.

---

## 10. Design direction

- **Distinct sub-brand within SiteViral**: warmer palette (rose/gold accent) layered on existing semantic tokens — a new `beauty` theme scope in `index.css` (`.beauty-scope { --primary: ...; --accent: ... }`) so it doesn't leak into the core app.
- Mobile-first, native-feel per project standards (40px touch targets, safe-area-insets).
- Provider cards: rounded image tile + rating pill + response-time chip + "Réserver" CTA.
- Booking flow as a 3-step stepper (Créneau → Formule → Paiement).

---

## 11. Out of scope for MVP (queued for v2)

- Home-service safety (panic button, live GPS share) — schema hooks reserved.
- Recurring appointments / packages.
- Provider teams / multi-staff calendars.
- In-app video consultation.
- Loyalty points specific to Beauty.

---

## 12. Deliverable order for the first coding turn

If you approve, I'll start with **Phase A**:
1. Migration: all `beauty_*` tables + `beauty_provider` role + RLS + GRANTs.
2. `/beauty` landing page (hero, categories, how-it-works) with warm sub-theme.
3. Nav entry + route wiring.
4. Provider onboarding wizard skeleton (KYC step reuses existing flow).

Then we iterate phase by phase, verifying after each.

---

**Confirm to proceed with Phase A, or tell me what to adjust** (scope, order, theme direction, commission %, deposit %, auto-release delay).
