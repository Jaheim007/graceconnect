# What's left from the acquisition plan

Done so far: the flyer engine (canvas renderer, three formats, four themes), the flyer for ambassadors in the Gain marketplace with their referral link embedded, and the "Share flyer" button on each seller product.

Everything below is still open. Order = impact.

## 1. Launch kit around the flyer (the flyer alone isn't the kit)

At publish, and re-openable any time from the product row:
- The three flyer formats already generated, plus a ready WhatsApp message, a Facebook/Instagram caption and an email line, written in the product's language from its real title, benefit and price.
- The branded short link (already available via the short-link hook) shown once, copyable, with a QR image download.
- One "Share now" sheet: WhatsApp, Facebook, copy, download-all.
- A gentle reminder card on the product if it has never been shared.

## 2. Instrumentation (nothing measurable today)

- A real `page_view` event on every public page with referrer, UTM, device, country. Today only UTM landings are logged, so attribution is blind.
- `first_touch_source` / `first_touch_page` stored at signup.
- An `is_internal` flag on organizations, set for internal and mentor accounts, so every metric can exclude them by default.
- A `marketing_spend` table (manual entries) so cost per paying seller becomes computable.

## 3. First-sale guarantees

- Automatic Discover placement window for a newly published product.
- Automatic listing in the affiliate marketplace with its commission visible.
- A visible progress strip on the product: views, shares, clicks — so "nothing is happening" becomes numbers.
- Day-14 zero-sales intervention: diagnose what's missing (no cover, no description, price outliers, never shared), offer the one-tap fix, re-offer the flyer pack, and offer pushing it to affiliates at a higher commission.

## 4. Affiliate engine finishing touches

One-tap enrolment with no approval, commission shown on every listing, personal link plus flyer, live earnings, low payout threshold. The marketplace and links exist; what's missing is the frictionless entry and the earnings feedback.

## 5. Fee transparency

A shared helper that computes the payment cost per method (Wave / MoMo / card, from a configurable rate table), stores it on the transaction, and renders the same four-line breakdown everywhere money appears (checkout, product, dashboard, receipt, payout statement):

```text
Buyer paid          1 000 F
Payment fee (Wave)     −15 F
SiteViral (10%)       −100 F   → 0 F on an offering
You receive            885 F
```

Offerings pass a zero platform fee. Existing per-org overrides keep working. Payment routing is untouched.

## 6. Landing page transformation

One promise, three doors — *Create it with AI* / *I already have my content* / *Earn by selling others'* — French first, phone first, the Church page as the proof vertical, and 10% / 0%-on-offerings stated openly. The invented platform stats get replaced with real counts or removed.

## 7. Buyer side

Weekly "new this week" broadcast (email + a shareable page), free lead-magnet products, and a second-purchase sequence for the buyers who already bought once.

## 8. Superadmin acquisition console + seller survey

`/superadmin/acquisition` with "exclude internal & mentor" on by default: sources, seller and buyer funnels with median time per step, first-sale health lists (never sold, dormant, exportable), affiliate performance, and money including payment costs and manual spend. Plus the 6-question seller survey.

## Technical notes

- Console reads through superadmin-only security-definer RPCs (`get_acquisition_overview`, `get_seller_funnel`, `get_first_sale_health`, `get_affiliate_performance`, `get_money_overview`), each taking an exclude-internal argument, following the existing advanced-analytics pattern.
- New tables and columns each ship with GRANTs and superadmin-only RLS in the same migration.
- Broadcasts and the day-14 intervention reuse the existing email function and activation engine rather than new infrastructure.
- Launch-kit captions are template-generated from product fields (no AI credits); only optional rewrites would cost credits.

## Suggested next step

Items 1 and 2 together: finish the launch kit around the flyer that's already built, and turn on instrumentation so the rest of the plan can be judged by numbers instead of guesses.
