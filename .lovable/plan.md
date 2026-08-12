# Who we target, what we charge, and the console that answers both

You are right on both points, and they change the plan. Your mentor's church is our biggest account and our own tool — it cannot be used as proof of anything, neither of product-market fit nor of willingness to pay 10%. And the segment should not be defined by "Ivorian" — it should be defined by something we can find in several countries.

## Point 1: the mentor account is excluded from now on

Mission Peniel ABC is 93 of 188 sales and 80 000 of 138 000 FCFA. With it removed, here is the real, unbiased picture of everything that has ever sold:

| Account | Type | Sales | Buyers | Revenue | Active from → to |
|---|---|---|---|---|---|
| NCho Yao | faith teacher | 48 | 47 | 31 500 | 21 Feb → 20 Jun |
| Eliteseditions | author | 9 | 9 | 5 000 | 24 Mar → 1 May |
| Zion | faith | 7 | 7 | 7 000 | 4 May → 12 May |
| Loic Zeze's books | business author | 5 | 5 | 10 000 | 23 Mar → 30 Mar |
| ZELTIN MALTA | faith | 5 | 5 | 1 500 | 25 Feb → 7 Mar |
| 10 others | mixed | 1–4 each | 1–3 | 0–1 500 | days, then stop |

So the honest reading is: **one real external account (NCho Yao, 47 distinct buyers) proved the model works, and nobody has been retained past ~4 weeks.** That is not "churches are our market". It is "we have one repeatable case and a retention problem". The console must flag internal/mentor accounts and exclude them from every metric by default, otherwise every number we look at for the next year will be his.

## Point 2: the segment, defined so it exists in many countries

Not "Ivorian church". The pattern that actually repeats across the paying accounts is:

**A teacher with an audience who sells written teaching to that audience, in French, paid by Mobile Money.** Faith is the biggest sub-group (NCho Yao, Zion, Zeltin, the mentor), but Eliteseditions and Loic Zeze are secular authors doing the exact same motion with the same tool.

That definition travels: francophone Africa (CI, SN, TG, BF, ML, BJ, CM, GA, CD, GN) plus the francophone diaspora (FR, BE, CA, US) — where the buyers have cards and much higher willingness to pay. We already have signups from TG, BF, SN, CM, GH, FR, US and a seller from Gabon, so the shape is not CI-only, it is CI-heavy because that is where the mentor's network is.

Practical consequence: the landing page speaks to "a teacher/author with an audience", with faith as the strongest proof case and the strongest single vertical page, not as the whole product. One core page + a dedicated church page + a dedicated author page, all in French, English later.

## Point 3: is 10% too much? Almost certainly the wrong lever right now

Total platform fees we have ever earned: **13 000 FCFA (~20 EUR)**, of which ~11 200 came from faith accounts and most of that from your mentor. Credit packs earned 9 000 FCFA from 4 purchases. Active subscriptions: 0.

At this scale, whether we take 5% or 10% changes almost nothing for us — but it changes a lot for how easy we are to say yes to. So the recommendation:

- **Offerings, tithes and donations: 0% platform commission.** Pass through only the payment cost. Taking a cut of a tithe is the single fastest way to lose a church, and the money there is not ours to price. This is also a real differentiator to say out loud.
- **Paid content (ebooks, courses, PDFs): drop the standard rate from 10% to 5%,** while offering **0% commission on a paid plan** (a flat monthly fee, priced in FCFA at a level a working pastor or author accepts). Sellers with volume move to the plan; small sellers stay free and cheap.
- **Keep credits for AI generation as they are** — that is the part people have actually paid for voluntarily, and it scales with usage rather than punishing success.
- Do not decide the exact numbers on my read alone: the pricing question goes into the seller survey (block below) and into a visible pricing page we can A/B, so the number comes from sellers rather than from us guessing.

## Landing page changes

- Speak to "teachers and authors who already have an audience", French first, phone first (39% of tracked events are mobile, main referrer is Facebook mobile).
- State the price model openly: free to start, 5% on sales, **0% on offerings**, Mobile Money in and out, payout in FCFA. Transparency is a feature in this market.
- Replace the invented figures in `PlatformStatsBar` / `usePlatformStats` with real numbers or with no numbers at all — at this scale, inflated stats read as fake.
- Two dedicated segment pages under the core page: Church / Ministry, and Author / Coach. Not one page pretending to be everything, not a whole product built for churches only.
- One primary CTA: publish your first paid resource.

## The internal console: `/superadmin/acquisition`

Every block has an "exclude internal & mentor accounts" toggle, on by default.

1. **Traffic and acquisition** — sessions by day/week, first-touch source (Meta, Facebook mobile, Google, Canva, WhatsApp, direct), referrers, entry pages, country, device, language, hour-of-day and day-of-week (current peak 21h).
2. **Signups and conversion** — signups per day, then signup → workspace → product created → published → first sale, with percentage and median time at each step, split by source and by country.
3. **Money in** — platform fees, credit pack sales, subscriptions, GMV, per day/month/year with year-to-date, and effective take rate per seller.
4. **Money out and unit economics** — a manual `marketing_spend` ledger (channel, campaign, amount, date) so we can compute CAC, cost per signup, cost per paying seller, and fees vs spend. Nothing records ad spend today, so this is unmeasurable until we enter it.
5. **Segments** — workspaces grouped by category and by country, with products, published, sold, revenue, last activity — so a segment we did not predict can announce itself.
6. **Retention and decay** — signup-month cohorts with share still creating/selling at M+1/M+2/M+3 (this is the actual problem: nobody except the mentor passed 4 weeks), plus exportable lists of sellers who published but never sold, and sellers dormant 30+ days.
7. **Content reality** — product mix, AI vs manual, price distribution of items that actually sold, top titles, top themes.

## Instrumentation we need first

- A real `page_view` event on every public page with referrer, UTM, device, country, language. Only 18 UTM events exist in total and no pageview event, so "where did they come from" is unanswerable for almost all visits today.
- `first_touch_source` / `first_touch_referrer` / `first_touch_at` on the profile at signup, so cohorts can be cut by channel forever.
- An `is_internal` flag on organizations so the mentor and our own test spaces stop polluting the data.
- A `marketing_spend` table you fill in per campaign.
- A 6-question seller survey: who you are, what you publish, what country, where you heard about SiteViral, what stopped you from publishing again, and **what commission or monthly price you would accept**. This is how the pricing decision gets made with evidence instead of instinct.

## Technical notes

- Events reuse `client_events` and the existing `useUtmCapture` / `useClientAnalytics` hooks; new columns on `profiles` and `organizations`, plus a new `marketing_spend` table with GRANTs and superadmin-only RLS.
- Console reads via security-definer RPCs restricted to superadmins (`get_acquisition_overview`, `get_activation_funnel`, `get_signup_cohorts`, `get_segment_matrix`, `get_money_overview`), each taking an `_exclude_internal` argument, mirroring `useAdvancedAnalytics.ts`.
- Country on `organizations` is dirty (89 nulls, free-text "GABON", "Côte d’Ivoire"); read country from `profiles.country` and normalise org country separately.
- The commission change touches the fee configuration and payout math, so it ships as its own step, after the console proves what we currently earn, and behind existing per-org fee overrides so current sellers are not surprised mid-cycle.
- Phases 1–3 do not touch dashboards, auth, payments or workspace logic. Phase 4 is presentation-only. Phase 5 is the pricing change.

## Order of work

1. Instrumentation + `is_internal` flag (so all analysis is honest from day one).
2. `/superadmin/acquisition` console, seven blocks, mentor excluded by default.
3. Seller survey + dormant-seller export, and direct outreach to the ~15 accounts that once sold.
4. Landing page: core "teachers and authors" page + Church page + Author page, transparent pricing.
5. Pricing change: 0% on offerings, 5% on sales, flat plan at 0%, decided with survey data in hand.
