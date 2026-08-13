# SiteViral Acquisition Plan — Fixing Demand Before Scaling Supply

## The diagnosis (from your own database, today)

| Reality | Number |
|---|---|
| Workspaces created | 113 |
| Published products | 173 |
| Products that have **never sold once** | **138 (80%)** |
| Workspaces that have **ever** made a sale | **15 of 113** |
| Total gross since February | 138,000 CFA |
| Distinct buyers, all time | 49 |
| Ambassador links created / total clicks | 151 / **13** |
| Signups: Mar → Aug | 118 → 11 |
| Weekly gross, last 5 weeks | 1,000 / 5,000 / 4,000 / 2,000 / 500 |

Your user who made 7,000 CFA in two days then went quiet is not an exception. She **is** the pattern. Every seller sells to their own phone contacts, exhausts them in 48 hours, and stops. There is no second wave because SiteViral currently has **no demand engine** — only a publishing tool.

**Conclusion: do not run an acquisition campaign yet.** Adding 500 sellers to a platform where 80% of products never sell would produce 500 discouraged users and kill word-of-mouth permanently. Fix the second wave first.

## What the market research says

- The model works regionally: **Selar** paid out ~$12.8M to 400,000 African creators in 2025 (up 22x since 2021). **Chariow**, francophone-focused, reports $5M+ paid out with individual creators at 5M–30M FCFA.
- **WhatsApp is the transaction and delivery backbone** of this market. Facebook and TikTok are the discovery layer. There is no dominant francophone marketplace yet — that gap is your opening.
- Foreign tools (Gumroad) fail here on payouts and card-only checkout. Mobile Money is the whole game.
- **Warning — your church assumption is unvalidated.** Francophone African churches publish sermons online in large volumes, but research found **zero examples of anyone successfully selling sermon content**. Churches give it away free. Do not make churches the beachhead on faith alone; validate it with real conversations first.

## The strategy: one beachhead, demand before supply

Stop talking to three audiences at once. Sequence them.

**Beachhead: practical-skills creators in Abidjan who already have a WhatsApp/Facebook audience.** Employment guides, Excel/accounting, digital marketing, trades, exam prep. They already sell manually via WhatsApp + Orange Money. They have proven demand and an existing audience — they only need better tooling. Côte d'Ivoire first because that's where your existing 49 buyers are.

Audience 2 (people with no content yet) and Audience 3 (resellers) come **after** the marketplace has enough buyers to absorb them.

## Phase 1 — Fix attribution (blocking, days)

`first_touch_source` and `first_touch_referrer` are **empty for all 290 profiles**. The columns exist; nothing writes to them. Until this works, every CFA of acquisition spend is unmeasurable. Fix the tracker, verify rows land, add a superadmin funnel view.

## Phase 2 — Build the demand engine (the real fix)

The goal: a seller's product keeps selling after their own contacts are exhausted.

1. **Make the marketplace a real discovery surface.** Ranked, category-browsable, search-indexed explore page. Today a product's only distribution is its author's contact list. This is the single biggest lever.
2. **Activate the ambassador network.** 151 links, 13 clicks — it's built and dead. Resellers are the proven second-wave mechanism in this market (WATIPAY, Netib Partners). Needs: one-tap WhatsApp-ready share kits with pre-written copy and images, a visible earnings leaderboard, and manual recruitment of the first 20 ambassadors by hand.
3. **Cross-selling.** Every purchase confirmation and every product page recommends 3 related products. Your 49 buyers should each be buying more than once — your top buyer already bought 15 times, which proves repeat demand exists when discovery exists.
4. **Bundles.** Let creators combine products, and create platform-curated bundles across creators so a new seller rides an established one's traffic.

## Phase 3 — Make the second wave a product feature

Instead of leaving sellers alone after launch:

- **Post-launch playbook**, delivered in-app on day 3 when sales flatten: relaunch angles, testimonial collection, WhatsApp status scripts, price tests.
- **"Your product is going quiet" trigger** — when a product sells nothing for 7 days, offer one concrete action, not a guilt notification.
- **Buyer testimonials → social proof** on the product page. This is what converts strangers rather than friends.
- **Honest expectation setting at publish time**: "Your first 10 sales come from your contacts. Sales 11+ come from the marketplace and ambassadors." She was discouraged partly because nobody told her what to expect.

## Phase 4 — Acquisition, only once Phase 2 works

Gate: **at least 40% of published products have made ≥1 sale.** Then, and only then:

- **Hand-recruit 20 creators** who already sell on WhatsApp — found in Ivorian entrepreneurship Facebook groups, TikTok/Facebook "vendeuses en ligne," and business communities like Abidjanaises In Tech. Direct DM, not ads. Onboard each personally.
- **WhatsApp-first funnel**: every share asset built for WhatsApp status and broadcast, because that's where the transaction actually happens.
- **Ambassador-led growth** as the primary paid channel — pay commission on results rather than ads on impressions.
- **Church vertical: validate, don't build.** 10 conversations with church media teams in Abidjan/Douala before any further church-specific investment.

## Technical scope

- Fix `PageViewTracker` first-touch persistence into `profiles`; verify with a live query.
- Rework the explore/marketplace page into a ranked discovery surface with categories and search.
- Ambassador share-kit generator (pre-written WhatsApp copy + image + short link), leaderboard, and click/conversion instrumentation on `affiliate_links`.
- Related-products recommendations on product pages and purchase confirmations.
- Bundle data model and checkout support.
- Seller-side "product went quiet" trigger and post-launch playbook surface.
- Superadmin acquisition dashboard: signups by source, % products with ≥1 sale, repeat-purchase rate, ambassador-attributed revenue.

## What I need from you

1. Confirm **Côte d'Ivoire practical-skills creators** as the beachhead (vs. churches).
2. Confirm we **delay acquisition** until the demand metrics move.
3. Whether I should start with Phase 1 + Phase 2 item 1 (attribution + marketplace discovery) in the first build pass.
