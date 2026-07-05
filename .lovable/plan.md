
# Beauty pivot — Chat-first bookings + Provider portfolios

## 1. New booking flow (Fiverr-style)

Primary path: **provider sends the offer in chat**, client pays it.

```text
Client → Explore (providers) → Provider page → "Discuter"
   → Chat opens (no payment yet)
   → Provider taps "Envoyer une offre" in chat:
        · pick service · pick date/time · confirm price · optional note
   → Special message bubble appears in the thread: "Offre — Coupe femme
     15/07 14:00 · 15 000 XOF" with [Payer & confirmer] button (client side)
     and [Annuler l'offre] (provider side, before payment)
   → Client taps Pay → existing beauty-create-booking flow →
     escrow → confirmed booking (same downstream logic as today)
```

Fallback path kept: the **"Réserver"** button on the service card / provider page
still works exactly as today for clients who want to self-book without chatting.

## 2. Provider portfolio

Provider profile (`/beauty/pro/:id`) gets three tabs:

- **Services** — existing services list with prices (already built).
- **Galerie** — photo grid (before/after, salon interior, work samples).
- **Vidéos** — short uploads + pasted YouTube / TikTok / Instagram / Vimeo
  links, rendered with the existing `getVideoEmbedUrl` helper.

Provider space (`/beauty/pro`) gets a **"Mon portfolio"** section to upload
photos, add/remove videos, and reorder.

## 3. Explore page becomes provider-first

`/beauty/search` cards now show **providers** (salon/barber shops) with:
cover photo, business name, city, rating, service count, starting-from price.
Tap → provider page with the new tabs + a prominent **"Discuter"** button
(and a secondary **"Voir les services"**).

## 4. Technical changes

### Database (one migration)
- `beauty_provider_media` table: `id, provider_id, kind ('photo'|'video'),
  url, embed_url, position, created_at`. RLS: provider owns write, everyone
  reads. GRANTs to anon/authenticated/service_role.
- `beauty_offers` table: `id, conversation_id, provider_id, client_id,
  service_id, slot_start, slot_end, location_type, address, price_amount,
  currency, status ('pending'|'accepted'|'declined'|'expired'|'cancelled'),
  booking_id nullable, expires_at, created_at`. RLS: participants only.
- Storage: reuse existing `beauty-media` bucket (or create if missing) for
  photo/video uploads.

### Edge functions
- `beauty-send-offer` (new): provider creates a `beauty_offers` row + posts
  a system message into the conversation with `type='offer'` referencing the
  offer id. Validates slot availability.
- `beauty-accept-offer` (new): client-side; reuses `beauty-create-booking`
  internally to mint a pending booking and returns the checkout URL. On
  webhook success, offer row flips to `accepted` and links `booking_id`.

### Frontend
- `BeautyConversation.tsx`: add offer message renderer + provider-only
  "Envoyer une offre" sheet (service picker, date/time, price override).
- New `BeautyProviderPortfolioEditor.tsx` under `/beauty/pro/portfolio`.
- `BeautyProviderProfile.tsx`: add Services / Galerie / Vidéos tabs.
- `BeautySearch.tsx`: switch from service cards to provider cards.
- Keep `BeautyBookingWizard.tsx` and its "Réserver" entry point unchanged
  as the fallback self-booking path.

## 5. Out of scope for this round

- No changes to payout timing, escrow rules, KYC, or currency logic.
- No changes to reviews, disputes, cancellation windows.
- No provider-scheduled bookings for a specific known client from the
  dashboard (can add later — it's option 3 from your answer, you picked
  option 2).

---

Approve and I'll ship it in this order: migration → portfolio UI (upload +
tabs) → explore switch → chat offers (send + accept + pay).
