# Acquisition first: bring buyers, guarantee the first sale, then measure

You are right that the technical work is not the bottleneck. The bottleneck is that a seller publishes, gets no sale for weeks, and quits. Commission percentage does not fix that; demand does. So this plan is about demand, with the fee math corrected and measurement reduced to what actually informs decisions.

## First, the fee math — 0% cannot mean we pay the processor

You are correct, and this is important: GeniusPay bills us per transaction (Wave CI ~1.5%, Mobile Money ~3.5%, card/Stripe ~5%). If a buyer pays 1 000 and we show the seller 1 000 and owe them 1 000, we lose the processing cost on every single transaction. At any volume that kills us.

So the rule becomes: **payment cost is always passed through and shown by name; SiteViral's own margin is what we set to zero or low.**

- Every transaction is displayed as three lines everywhere (product page for the seller, dashboard, payout statement): **gross paid by buyer → payment fee (Wave / MoMo / card, shown at the real rate) → SiteViral fee → net to you.** No hidden math, no surprise at payout.
- **Offerings, tithes and donations: 0% SiteViral fee, payment cost passed through.** We can say honestly "we take nothing on your offerings" without losing money.
- **Paid content: 5% SiteViral fee on top of the payment cost** (not instead of it), with 0% on a flat monthly plan for sellers with volume. On card payments where the processor takes ~5%, the seller sees that it is the card that is expensive, not us — and we nudge buyers toward Wave/MoMo, which is cheaper for everyone.
- Optionally, an org-level switch: "who absorbs the payment fee" — seller (default) or buyer (added at checkout). Churches often prefer the donor covering it.

This is a change to fee display and payout math, so it ships as its own step, behind the existing per-org fee overrides so nobody's numbers change mid-cycle.

## The three audiences (all three matter, and they feed each other)

1. **Has content already** — a book, a teaching, a training. Needs: upload, price, get paid. Fastest to a first sale.
2. **Has no content yet** — comes to create it with the AI. Needs: from idea to a finished ebook in one session. This is our strongest differentiator.
3. **Has no content and does not want any** — sells other people's products for a commission. This audience is the demand engine: they bring buyers to sellers, which is exactly what is missing today.

The landing page therefore has one promise and three doors: "Create it, sell it, or earn by selling others' — you get paid by Mobile Money." Each door leads to its own page (Create with AI / I already have content / Earn as an affiliate), plus the Church page as the strongest proof vertical. All French first.

## The acquisition and first-sale engine (the core of this plan)

**1. Turn affiliates into the traffic machine.** One-tap enrollment, no approval, no minimum. Every published product is automatically listed in an affiliate marketplace with its commission rate visible. Affiliates get a personal link, a WhatsApp-ready message, and a visual, generated for them. Real-time earnings, small payout minimum, visible leaderboard. This gives audience-less people a reason to arrive daily, and gives sellers buyers without doing marketing themselves.

**2. A "launch kit" generated at publish time.** The moment a seller publishes, we generate for them: a square visual, a WhatsApp message, a Facebook caption, a story image, and a short link — in their language, about their product. One tap to share. This market sells on WhatsApp and Facebook mobile; today we make them invent the post themselves, and most never post at all.

**3. Guarantee the first 100 views, not just the first sale.** On publish, the product automatically gets: Discover placement for its first days, inclusion in the next buyer broadcast, an affiliate marketplace listing, and a free short link. The seller sees a live counter of views and shares so "nothing is happening" becomes visible progress instead of silence.

**4. Activate the demand side we already have.** We have ~110 buyers and ~290 accounts, and no one talks to them. Weekly "new this week" broadcast (email + WhatsApp-shareable page), free lead-magnet products to capture new buyers cheaply, and a re-engagement sequence for buyers who bought once (22% already bought twice — that is our best asset).

**5. Recruit sellers who bring their own crowd.** One leader with a congregation or a following equals dozens of buyers on day one; a lone author equals none. So outreach targets people who already have an audience — churches, ministries, coaches, teachers, editors — across francophone Africa and the diaspora, not only Côte d'Ivoire. Concretely: a referral flow where an existing seller invites another leader, and a short partner/ambassador pitch page they can forward.

**6. Break the discouragement loop directly.** For any seller with 0 sales after 14 days, the product itself intervenes: what is missing (price too high, no cover, no description, never shared), a one-tap fix, the launch kit again, and the option to push it to affiliates with a higher commission. Silence gets answered with an action, not an empty dashboard.

## Measurement, cut down to what changes decisions

One page, `/superadmin/acquisition`, with an "exclude internal & mentor accounts" toggle on by default — your mentor's church is ~half of all sales and would otherwise hide the truth in every chart.

1. **Where people come from** — sessions and signups by source (Meta, Facebook mobile, WhatsApp, Google, direct), referrers, entry pages, country, device, hour of day.
2. **The two funnels that matter** — seller: signup → workspace → product → published → shared → first sale (with median time at each step); buyer: visit → product page → checkout started → paid.
3. **First-sale health** — how many sellers ever sold, median days to first sale, how many published and never sold, how many are 30+ days dormant, exportable for outreach.
4. **Affiliate performance** — active affiliates, clicks, conversions, revenue they generated for sellers.
5. **Money** — GMV, our fees, payment costs paid out, credit packs, plans, and a manual `marketing_spend` ledger so CAC and cost per paying seller are computable. Nothing records ad spend today, so that number is unmeasurable until we enter it.

Plus a short seller survey (who you are, what country, what you publish, where you found us, what stopped you, what fee or monthly price you would accept) — so pricing gets decided with answers instead of instinct.

## Technical notes

- Instrumentation first: a real `page_view` event on every public page with referrer/UTM/device/country (today there are only 18 UTM events and no pageview event, so attribution is blind), `first_touch_*` fields on the profile at signup, an `is_internal` flag on organizations, and a `marketing_spend` table — all with GRANTs and superadmin-only RLS.
- The console reads via superadmin-only security-definer RPCs (`get_acquisition_overview`, `get_seller_funnel`, `get_first_sale_health`, `get_affiliate_performance`, `get_money_overview`), each accepting `_exclude_internal`, following the `useAdvancedAnalytics.ts` pattern.
- Launch kit reuses the existing image generation and short-link systems; broadcasts reuse the `send-email` function and the activation engine already in place.
- Affiliate marketplace, links and commissions already exist in the schema — this is mostly surfacing and simplifying them, not new infrastructure.
- Replace the inflated numbers in `usePlatformStats` / `PlatformStatsBar` with real ones or none; at this scale invented stats read as fake.
- Fee display and payout changes are isolated to the fee/payout layer; nothing else in dashboards, auth or workspace logic changes.

## Order of work

1. Instrumentation + `is_internal` flag, so every number after this is honest.
2. Launch kit at publish + guaranteed first-100-views placement + the 0-sales intervention.
3. Affiliate engine simplified to one tap, with WhatsApp-ready assets and a visible marketplace.
4. Landing page: one promise, three doors (create / already have content / earn), plus the Church page; transparent fees.
5. Buyer broadcast + lead magnets + re-engagement of existing buyers.
6. `/superadmin/acquisition` console and the seller survey.
7. Fee model: gross → payment fee → SiteViral fee → net shown everywhere, 0% on offerings, 5% on sales, 0% on a flat plan.
