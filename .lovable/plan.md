# SiteViral Church — completion plan

Most of what you described is already built. Below is what exists today, what's missing, and the order I'll build the gaps.

## Already live (no work needed)

- **Sermon → Book/PDF/Blog** — upload audio, Whisper transcription, Gemini variants (summary, notes, WhatsApp, ebook, reel, blog). Pages: `/church/pro/sermons` + `sermons/:id`. Edge fns: `church-transcribe-sermon`, `church-generate-variant`, `church-generate-sermon-pdf`.
- **Sell sermon PDFs** — public buy page `/church/:slug/pdf/:pdfId` + `church-buy-sermon-pdf`, `church-sermon-pdf-download`.
- **Donations / tithes / offerings** — `/church/pro/giving`, public `/church/:slug/give`, edge fns `church-init-giving`, `church-init-giving-stripe`, `church-giving-status`.
- **Campaigns** (targeted fundraising with goal) — `/church/pro/campaigns`.
- **Prayer requests** (public submits, church replies) — `/church/pro/prayer`.
- **Announcements** — `/church/pro/announcements`.
- **Events (schedule only)** — `/church/pro/events`, table `church_events`.

## Gaps to build

1. **Event tickets & registration** — `church_events` has no price/capacity, no ticket table, no checkout. Add paid + free ticketing with QR codes on receipts.
2. **Appointments with the pastor** — entirely missing. Public books a slot (name, phone, reason), pastor sees inbox, confirms/declines. Optional paid appointments later.
3. **Sell broader shop items** (prayer books, teachings, devotions, audios) — today only sermon-derived PDFs sell. Add a light "church shop" item type on top of the existing sermon-PDF plumbing so any file (audio, PDF, ebook) can be listed with a price.

## Build order (this turn = only step 1 + step 2)

### Step 1 — Event tickets

- Migration: add `price_cents int`, `currency text`, `capacity int`, `tickets_sold int` to `church_events`. New table `church_event_tickets` (event_id, buyer_user_id?, buyer_email, buyer_name, buyer_phone, qty, amount_cents, status, payment_ref, qr_code, created_at) with RLS (owner reads all, buyer reads own by email match).
- Pro UI: extend `ChurchProEvents.tsx` — price/capacity fields, attendee list drawer per event.
- Public UI: `/church/:slug/events/:id` — event detail + "Réserver ma place" form → free ticket instant, paid ticket goes through existing GeniusPay/Stripe rails (reuse `church-init-giving-stripe` pattern in a new `church-buy-event-ticket` edge fn + `church-event-ticket-status`).
- Success page shows QR + ticket ID.

### Step 2 — Appointments

- Migration: `church_appointments` (church_id, requester_user_id?, name, phone, email, subject, message, requested_at timestamptz, duration_min int, status: new|confirmed|declined|done, staff_note, created_at, updated_at). RLS: church owner ALL, requester SELECT own.
- Pro UI: new page `/church/pro/appointments` — inbox with confirm/decline, calendar-style list grouped by day.
- Public UI: on `ChurchPublicProfile`, add "Prendre rendez-vous avec le pasteur" card → simple form (name, phone, subject, date/time picker). Anonymous allowed.
- Wire into dashboard `quickLinks`, sidebar override, action nav overrides, and feature key `appointment` (already in the primary features list for church).

### Step 3 — Shop (deferred to next turn unless you say otherwise)

Broader "church shop" for any downloadable — audio, teachings PDF, devotions — reusing the sermon PDF flow with a generalized `church_shop_items` table. I'll propose this separately once 1 and 2 land.

## Technical notes

- Payments reuse the existing GeniusPay / Stripe routing already used by Giving — no new payment plumbing.
- Tickets and appointments both get row-level security scoped by `church_providers.user_id`.
- QR codes: use the `qrcode` npm package (already in dependencies if not, add) rendered client-side from the ticket UUID.
- Everything bilingual FR/EN via existing `useI18n` pattern.

Confirm and I'll ship step 1 + step 2 in the next turn.  
  
**Also make sure to fix the nav bar forboth mobile and PC to match the functionality** 