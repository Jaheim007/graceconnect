# Who we target first, and the acquisition console to prove it

Your question was simple: who is the audience, and why. The database already answers it. Below is the answer with the evidence, then what we change on the landing page, then the internal console that lets you keep answering this yourself every week.

## The answer: church and faith-teaching leaders in Côte d'Ivoire

Target the **Francophone Ivorian pastor / bishop / faith teacher who sells teaching content (ebooks, PDFs of sermons and studies) at 500–5 000 FCFA to his own congregation and following, on a phone, paid by Mobile Money.**

## Why — the numbers, not opinion

Only 15 of 113 workspaces ever made a sale. Four of them are faith accounts, and they are almost the entire business:

- Faith accounts (Mission Peniel ABC, NCho Yao, Zion, Zeltin Malta) = **153 of 188 sales (81%)**, **120 000 of 138 000 FCFA (87%)** and **11 200 of 13 000 FCFA of our platform fees (86%)**.
- Mission Peniel ABC alone: 93 sales, 41 distinct buyers, 80 000 FCFA, first sale 23 Feb, last sale **11 Aug** — the only account with six months of continuous selling. Everyone else stopped after weeks.
- NCho Yao (bishop, filed as "leader"): 48 sales, 47 distinct buyers. The top-selling titles in the whole catalog are his sermon ebooks at 1 000–5 000 FCFA.
- 24 of 107 buyers bought more than once (22% repeat) — congregations come back.
- 214 of 269 products are ebooks, 191 of 208 AI projects are ebooks. Courses, video, and every service vertical (beauty, home, events, education) are effectively dead: 2 beauty providers, zero elsewhere.
- 245 of 289 profiles are Côte d'Ivoire; 6 people prefer English. This is a one-country, one-language product today.

**Your 10% question is already answered.** Mission Peniel paid 7 900 on 80 000 (9.9% effective) and NCho Yao 3 150 on 31 500 (10.0%), across 141 transactions, without churn. Churches have been paying ~10% for six months. That is real data, not a guess.

**Why they are the right beachhead, structurally:** a church leader arrives with an audience already assembled and a weekly reason to publish (the Sunday message). Distribution is built into the customer. An independent infopreneur arrives with no audience, so he needs us to solve traffic — which we cannot do yet.

## Why not the alternatives

- Infopreneurs / business authors: 15 business + 67 "leader" workspaces but almost no sales outside the two faith accounts. They churn within weeks.
- Service marketplaces (beauty, home, events, education): no supply, no bookings, no revenue. Keep hidden, do not market.
- Courses: 10 course products, 0 sales. Keep the feature, do not lead with it.
- NGO / associations: 1 workspace. No signal either way; revisit after the church beachhead works.

Secondary segment to keep, not to lead with: the Ivorian AI/business ebook author, because he shares the exact same pipeline (write with AI → sell an ebook → Mobile Money).

## What this changes on the landing page

The current landing page sells "create, sell and earn with your digital content" — generic creator-economy positioning aimed at nobody in particular. Rewrite it for the pastor:

- Headline and proof in French, for a church leader turning preaching into resources his members buy.
- Concrete price reality shown up front: 500–5 000 FCFA, Mobile Money, payout in FCFA, 10% commission stated openly (they already accept it — hiding it costs trust).
- Proof from the real accounts (with their permission) instead of the invented figures currently in `PlatformStatsBar` / `usePlatformStats`; in a market this small, inflated numbers read as fake.
- Mobile-first above the fold — 39% of tracked events are mobile and the main external referrer is Facebook mobile.
- One primary CTA: "Publish your first teaching" → the church/creation flow. Giving/offerings stays as the second promise, since it is what pulls the church in but not what has produced revenue yet.
- Keep an unlinked secondary page for the general creator/author, so the second segment still converts.

## The internal console: `/superadmin/acquisition`

One place that answers "what is happening to this business", refreshed from live tables. Blocks:

1. **Traffic and acquisition** — visits and unique sessions by day/week, first-touch source (Meta, Facebook mobile, Google, Canva, direct, WhatsApp), referrer table, landing pages entered on, country, device, language, and **hour-of-day / day-of-week activity** (current peak is 21h).
2. **Signups and conversion** — signups per day/week, signup → workspace → first product → published → first sale funnel with percentages and median time between each step, split by source and by segment.
3. **Money in** — platform fees earned, credit pack sales (currently 4 completed, 9 000 FCFA), subscriptions (currently 0), GMV processed, by day/month/year, with running year-to-date totals.
4. **Money out and spend** — a manual `marketing_spend` ledger (channel, campaign, amount, date) so the console can compute **CAC, spend per signup, spend per paying workspace, and fee revenue vs spend**. Nothing today records ad spend, so this cannot be computed until we enter it.
5. **Segments** — workspaces grouped by category/type/world with counts of products, published, sold, revenue and last activity date, so a new dominant segment shows up on its own instead of us guessing.
6. **Cohorts and decay** — signup-month cohorts with the share still creating or selling in M+1/M+2/M+3, and a dormant-workspace list (published but never sold, or no activity in 30 days) to export for outreach.
7. **Content reality** — product type mix, AI vs manual, price distribution of items that actually sold, top titles, top themes.

## Instrumentation we must add first (the console is blind without it)

- A real `page_view` event on every public page with referrer, UTM, device, country, language. Today only 18 UTM events exist in total, all Meta paid, and there is no pageview event at all — so "where did they come from" is currently unanswerable for 95% of visits.
- `first_touch_source` / `first_touch_referrer` / `first_touch_at` stored on the profile at signup, so every cohort can be split by channel forever.
- A `signup_completed` event, and a `marketing_spend` table you fill in per campaign.
- A one-time 5-question survey to workspace owners: who you are, what you publish, where you heard about SiteViral, what stopped you from publishing, what you'd pay for. This is how we confirm the church read qualitatively before spending money on ads.

## Technical notes

- Events reuse `client_events` and the existing `useUtmCapture` / `useClientAnalytics` hooks; new columns on `profiles` and a new `marketing_spend` table get GRANTs plus superadmin-only RLS.
- The console reads through security-definer RPCs restricted to superadmins (`get_acquisition_overview`, `get_activation_funnel`, `get_signup_cohorts`, `get_segment_matrix`, `get_money_overview`), mirroring the pattern in `useAdvancedAnalytics.ts`.
- Country data is dirty on `organizations` (89 nulls, free-text "GABON", "Côte d’Ivoire"); the console reads country from `profiles.country` and normalises org country separately.
- Phases 1–3 touch no dashboards, auth, payments or workspace logic. Phase 4 (landing page) is presentation-layer only.

## Order of work

1. Instrumentation: `page_view`, `signup_completed`, first-touch columns, `marketing_spend` table.
2. `/superadmin/acquisition` console with all seven blocks (blocks 1–3 and 5–7 work off data that already exists).
3. Owner survey + dormant/paying workspace exports for direct outreach.
4. Landing page rewritten for the church/faith-teaching leader, with real proof numbers replacing the inflated ones.
