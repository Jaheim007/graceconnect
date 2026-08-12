# SiteViral — the full plan: fees settled, then acquisition

## Part 1 — The fee question, settled

You are right and I was wrong to say 5%. Here is the real chain, because SiteViral is the merchant of record on GeniusPay (funds land in our single merchant account, payouts are manual):

```text
Buyer pays 1 000
  −  GeniusPay cost   (Wave CI ~1.5% | MoMo ~3.5% | card ~5%, up to ~8%)
  −  SiteViral margin
  =  what we owe the seller
```

The processor takes its cut before the money is ours. So we can never promise the seller the full amount, and we can never set a total rate below what the processor charges — on card that alone is 5–8%.

**Decision: keep 10%, all-inclusive.** One number the seller understands, payment fees included. What we actually keep varies by method: ~8.5% on Wave, ~6.5% on Mobile Money, ~2–5% on card. That is honest, it is safe on every method, and it is what you already have.

**And on offerings / tithes / donations: 0% SiteViral margin, payment cost only.** This is possible even though we are not the processor, because we deduct the operator's real cost rather than absorbing it. The church receives the amount minus the operator's fee (as little as 1.5% on Wave), and we keep nothing. What we must never say is "the church receives 100%" — that would mean paying Wave out of our pocket.

So the promise becomes: **10% all-inclusive on sales. 0% commission on your offerings — only the mobile-money operator's cost.** Nothing hidden, and nothing that loses money.

Everywhere money is shown (product page, dashboard, payout statement, receipt), four lines:

```text
Buyer paid          1 000 F
Payment fee (Wave)     −15 F
SiteViral (10%)       −100 F   → 0 F for an offering
You receive            885 F
```

Optional per-workspace switch: who covers the payment fee — the seller (default) or the buyer (added at checkout). Churches usually prefer the donor to cover it.

Two later levers, not now: a flat monthly plan that drops the sales rate to ~5%, and nudging buyers toward Wave since it is cheapest for everyone.

## Part 2 — Who we are building for

Three audiences, all real, and they feed each other:

1. **Already has content** — a book, a teaching, a training to sell. Fastest to a first sale.
2. **Has no content yet** — comes to create it with the AI. Our strongest differentiator.
3. **Wants no content of their own** — sells other people's products for commission. This is the traffic engine: they bring the buyers the first two groups lack.

Defined by behaviour, not by nationality: teachers, pastors, coaches, authors and their sellers, across francophone Africa and the diaspora (CI, SN, TG, BF, CM, GA, CD… plus FR, BE, CA, US). We already have accounts in seven countries; the CI concentration reflects your mentor's network, not a ceiling.

For the record: your mentor's church is ~half of all sales ever, so it is excluded by default from every metric from now on — otherwise every chart we look at is really a chart of one account.

## Part 3 — Acquisition and the first-sale engine (the real work)

The killer today is silence: someone publishes, nothing happens for weeks, they quit. Six moves, in order of impact.

**1. Launch kit generated at publish — with a real flyer at its centre.** The moment a product goes live, we generate a ready-to-post pack: a poster-style flyer, a square version for feeds, a story version, a WhatsApp message, a Facebook caption and a short link — in their language, about their product. One tap to share or download. Today we ask people to invent the post themselves, and most never post.

The flyer is the piece that makes this work, because it is the one asset people actually paste into WhatsApp, Facebook and their own websites. Your Canva mock is the right instinct — brand block of colour, one bold promise, the cover treated as the hero, a single clear action. Ours is generated, not designed by hand: SiteViral brand navy with the gold accent, the product cover placed large in a coloured panel, the real title and author, one benefit line, the price in the buyer's currency, the short link plus a QR code, and the SiteViral mark for credibility. Three formats out of one template — poster (4:5 / A4-ish, for websites and print), square (1:1, feeds), story (9:16). A small set of themes (navy/gold, dark, light, church) so it never looks like everyone else's. No stock illustration, no invented statistics — cover, title, price, link.

**2. The same flyer engine for ambassadors.** An affiliate opens any product in the marketplace and gets the same flyer instantly, with the link swapped for their personal referral link and their name or handle on it, so what they post pays them. No design step, no waiting on the seller: see a product you believe in, tap, post. This is what turns a browsing affiliate into a poster on the same day, and it is the cheapest traffic we will ever get.

**3. Guaranteed first 100 views.** On publish, the product automatically gets Discover placement for its first days, a slot in the next buyer broadcast, an affiliate marketplace listing, and its short link. The seller watches views and shares climb, so "nothing is happening" becomes visible progress.

**4. Affiliates as the traffic machine.** One-tap enrolment, no approval, no minimum. Every published product is listed with its commission visible. Each affiliate gets a personal link plus the flyer pack, live earnings and a low payout threshold. This gives audience-less people a daily reason to come, and gives sellers buyers without marketing.


**4. Wake up the demand side we already have.** ~110 buyers and ~290 accounts nobody talks to. Weekly "new this week" broadcast (email + a shareable page), free lead-magnet products to capture buyers cheaply, and a second-purchase sequence — 22% of buyers already bought twice, that is our best asset.

**5. Recruit sellers who arrive with a crowd.** One leader with a congregation equals dozens of buyers on day one; a lone author equals none. So: a seller-invites-a-leader referral flow, and a short forwardable pitch page for churches, ministries, coaches and editors.

**6. Break the discouragement loop in-product.** Zero sales after 14 days triggers a real intervention: what is missing (price too high, no cover, no description, never shared), a one-tap fix, the launch kit again, and the option to push it to affiliates at a higher commission. Silence gets answered with an action.

Landing page follows from this: one promise, three doors — *Create it with AI / I already have my content / Earn by selling others'* — with the Church page as the strongest proof vertical, French first, phone first, and the 10% / 0%-on-offerings stated openly. The invented numbers in `usePlatformStats` get replaced with real ones or removed; at this scale fake stats read as fake.

## Part 4 — Measurement, only what changes decisions

One page, `/superadmin/acquisition`, with "exclude internal & mentor accounts" on by default:

1. **Where people come from** — sessions and signups by source (Meta, Facebook mobile, WhatsApp, Google, direct), referrers, entry pages, country, device, hour of day.
2. **Two funnels** — seller: signup → workspace → product → published → shared → first sale, with median time per step. Buyer: visit → product page → checkout started → paid.
3. **First-sale health** — how many sellers ever sold, median days to first sale, published-but-never-sold list, 30+ days dormant list, exportable for outreach.
4. **Affiliates** — active affiliates, clicks, conversions, revenue generated for sellers.
5. **Money** — GMV, our margin, payment costs paid to GeniusPay/Stripe, credit packs, plans, and a manual `marketing_spend` ledger so CAC and cost per paying seller are computable. Nothing records ad spend today, so that stays unmeasurable until we enter it.

Plus a 6-question seller survey (who, country, what you publish, where you found us, what stopped you, what rate or monthly price you would accept) — so the next pricing decision comes from sellers.

## Technical notes

- Instrumentation first: a real `page_view` event on every public page with referrer/UTM/device/country (today there are 18 UTM events and no pageview event, so attribution is blind), `first_touch_*` fields set at signup, an `is_internal` flag on organizations, and a `marketing_spend` table — each with GRANTs and superadmin-only RLS.
- Console reads through superadmin-only security-definer RPCs (`get_acquisition_overview`, `get_seller_funnel`, `get_first_sale_health`, `get_affiliate_performance`, `get_money_overview`), each taking `_exclude_internal`, following the `useAdvancedAnalytics.ts` pattern.
- Fee work is display + payout math only: a shared helper that computes payment cost per method (Wave / MoMo / card, from a configurable rate table), stores it on the transaction, and renders the same four-line breakdown everywhere. Offerings pass `platform_fee = 0`. Existing per-org fee overrides keep working so no current seller's numbers change mid-cycle. `usePaymentGateway` routing is untouched.
- Launch kit reuses the existing image generation and short-link systems; broadcasts reuse `send-email` and the activation engine; affiliate links, commissions and marketplace tables already exist — this is surfacing and simplifying, not new infrastructure.

## Order of work

1. Instrumentation + `is_internal` flag, so every number after this is honest.
2. Launch kit at publish, guaranteed first-100-views placement, and the 14-day zero-sales intervention.
3. Affiliate engine reduced to one tap, with WhatsApp-ready assets and a visible marketplace.
4. Landing page: one promise, three doors, plus the Church page, with fees stated openly.
5. Buyer broadcast, lead magnets, second-purchase sequence.
6. Fee transparency: the four-line breakdown everywhere, 10% all-inclusive on sales, 0% margin on offerings.
7. `/superadmin/acquisition` console and the seller survey.
