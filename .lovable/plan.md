# Who actually uses SiteViral — audience study and acquisition plan

Goal: stop guessing. Use the real data in the app to name who comes, what they publish, what they pay for, where they drop off — then align the landing page and onboarding to that person.

## What the data already says (queried live)

Volume, Feb 20 2026 → Aug 12 2026:
- 289 signups, 113 workspaces, 269 products, 208 AI projects, 188 completed purchases totalling 138 000 (mostly FCFA), 107 distinct buyers.
- Signups are front-loaded: Feb 76, Mar 118, Apr 48, May 10, Jun 16, Jul 11, Aug 10. Last 30 days: 13 signups, 3 workspaces that published anything, 1 person using AI creation.

Who they are:
- Geography is one country: 245 of 289 profiles are Côte d'Ivoire. Then TG 3, FR 3, BF 2, SN 2, GH/CM/US 1. Language is French — only 6 profiles prefer English.
- Workspace type: 96 of 113 are `digital_products` in the digital world, 13 digital-products-in-church-world, 2 real church workspaces, 2 beauty. Every other vertical (home, events, education) has zero providers.
- Declared category: leader 67, business 15, church 14, other 8, community 7, ngo/ministry 2.
- 83 of 289 profiles own a workspace; 206 have none (buyers, curious visitors, or drop-offs).

What they publish:
- 214 of 269 products are ebooks (137 published, 120 AI-generated), 39 PDFs, 10 courses, 3 video, 3 other.
- AI projects are 191 ebooks vs 17 course packs. Courses are barely used.
- The catalog is overwhelmingly Francophone Christian teaching content. One church (Evêque Ncho Yao) accounts for most of the top-selling titles at 1 000–5 000 FCFA.
- Average non-zero price: ebooks ~21 981 (skewed by outliers), PDFs ~3 632; actual sellers cluster at 500–5 000 FCFA.

Money and funnel:
- 71 of 113 workspaces created a product, 52 published, only 15 ever made a sale. Sales peaked in March (122) and have been near zero since (Jul 4, Aug 4).
- Median-ish time from workspace creation to first product: ~62h average.
- 45 of 83 owners created their workspace within 1h of signup — intent at signup is strong, follow-through is the problem.

Traffic and campaigns:
- Referrers: Google accounts (auth), then facebook mobile (m.facebook.com, lm.facebook.com, www.facebook.com ≈ 230 hits), Canva 82, Google search 29, Gmail app 22.
- Only 18 `utm_landing` events exist, all `meta / paid`: catalogue_w1 9, stars_w1 5, gratuits_w1 3, ai_studio_w1 1. So paid Meta is the only tracked channel and it is tiny.
- Event tracking is thin: `experiment_exposure` 2 619 and `wizard_step` 1 573 dominate; there is no pageview event, no signup-source event, no landing-CTA breakdown.

Working hypothesis on the ICP: **Francophone West African (Ivorian) church leaders, pastors and faith-adjacent authors, mobile-first on Facebook, who want to turn preaching/teaching into a cheap ebook (500–5 000 FCFA) sold via Mobile Money.** The secondary segment is Ivorian infopreneurs selling AI/business guides. The service marketplaces (beauty, home, events, education) have no real users at all.

## The study — what we run next

Phase 1 — Instrument acquisition (this is the biggest gap)
- Add a real `page_view` client event with referrer, UTM, device, and locale on every public page, not just UTM landings.
- Persist first-touch source on the profile at signup (utm/referrer captured before auth, written after) so every future cohort can be split by channel.
- Log a `signup_completed` event with the source and the intended action.

Phase 2 — A private founder analytics page (`/superadmin/audience`)
One page, five blocks, all read from real tables:
1. Acquisition: signups per week by first-touch source, referrer table, country/language split.
2. Segments: workspace type × declared category × world, with counts of products, published, sold.
3. Content: product type mix, AI vs manual, price distribution of *products that actually sold*, top titles and themes.
4. Activation funnel: signup → workspace → first product → published → first sale, with conversion % and median time between steps.
5. Retention/decay: cohort by signup month, share still creating or selling in M+1/M+2/M+3, plus a "dormant workspaces" list.

Phase 3 — Qualitative layer
- A 5-question in-app survey shown once to owners: who you are, what you publish, where you heard about SiteViral, what stopped you from publishing, what you'd pay for.
- Export the 15 workspaces that sold and the 37 that published but never sold, for direct outreach.

Phase 4 — Act on it (after the data page exists)
- Rewrite the landing page for the confirmed ICP: French-first, faith/teaching-content-first proof, Mobile Money and 500–5 000 FCFA pricing shown explicitly, Facebook-mobile-optimised above the fold.
- Replace the invented social-proof numbers in `PlatformStatsBar` / `usePlatformStats` with real counts, since inflated stats will read as fake to a small local market.
- Decide explicitly whether the dormant verticals stay hidden or get retired.

## Technical notes

- New client events go through the existing `client_events` table and `useUtmCapture` / `useClientAnalytics` hooks; add `page_view` and `signup_completed`, plus `first_touch_source` + `first_touch_referrer` columns on `profiles` (with GRANTs and owner-scoped RLS).
- The analytics page uses read-only security-definer RPCs (`get_audience_acquisition`, `get_activation_funnel`, `get_signup_cohorts`, `get_content_mix`) restricted to superadmins, mirroring the pattern in `useAdvancedAnalytics.ts`.
- Country data is dirty (`organizations.country` is 89 nulls plus free-text like "GABON", "Côte d’Ivoire"); the funnel should read country from `profiles.country` and a normalising step should be added for orgs.
- No existing dashboards, auth, payments or workspace logic change in Phases 1–3; Phase 4 is presentation-layer only.

## Order of work

1. Instrumentation (events + first-touch columns).
2. `/superadmin/audience` page with the five blocks from data that already exists.
3. In-app survey + export.
4. Landing page and positioning rewrite driven by the findings.
