---
name: GeniusPay Migration
description: Post-Paystack switch to GeniusPay as the African PSP, with hosted checkout + manual payouts
type: feature
---

# GeniusPay — Primary African PSP (replaces Paystack)

## Why
Paystack was replaced by GeniusPay to gain native Wave CI support and a single MoMo
+ card hosted-checkout flow across all West/Central Africa + PawaPay countries.

## Architecture

- **Base URL**: `https://geniuspay.ci/api/v1/merchant`
- **Auth**: `X-API-Key` (public) + `X-API-Secret` (server-only) headers.
- **Currencies**: GeniusPay accepts XOF / EUR / USD. PawaPay extras (XAF, CDF, KES,
  RWF, SLE, UGX, ZMW, GHS, NGN) are converted transparently to XOF on their side.
- **Hosted checkout**: POST `/payments` without `payment_method` → returns
  `checkout_url`; redirect browser to it. Buyer picks Wave / Orange / MTN / Moov / card.
- **Reference format**: `MTX-XXXXXXXXXX` (GeniusPay-generated). Stored in the existing
  `paystack_reference` columns to avoid a destructive DB rename.
- **Webhook signature**: `HMAC-SHA256(timestamp + "." + raw_body, GENIUSPAY_WEBHOOK_SECRET)`,
  header `X-Webhook-Signature`. Replay window = 300s on `X-Webhook-Timestamp`.

## Edge functions
- `geniuspay-init` — auth required, calls POST /payments, returns checkout_url + reference.
- `geniuspay-webhook` — public, verifies HMAC, routes payment.success to shared `processTransaction()`.
- `geniuspay-verify` — auth required, used by `/payment/success` page as fallback when webhook is delayed.

## Frontend
- `useGeniusPay().openCheckout(...)` redirects via `window.location.href`.
- `usePaymentGateway()` is the single entry point: mobile_money + apple_pay + African card → GeniusPay,
  non-African card → Stripe. `usePaystack` is legacy/unused.
- `/payment/success` recognises `MTX-` references and `gateway=geniuspay` and polls `geniuspay-verify`.

## Payouts
Manual. GeniusPay collects into the platform balance; superadmin reads `/account/balance`
and issues per-org `manual_payouts` rows. Minimum payout: 10,000 XOF (unchanged).

## MoR
GeniusPay holds funds in SiteViral's single merchant account → SiteViral is the MoR for
African transactions. All KYC/AML obligations remain on the platform (unchanged from Paystack era).

## Secrets
- `GENIUSPAY_API_KEY` — pk_live_… (public key)
- `GENIUSPAY_API_SECRET` — sk_live_… (server-only)
- `GENIUSPAY_WEBHOOK_SECRET` — whsec_live_… (returned only at webhook creation)
