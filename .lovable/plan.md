## Goal

1. Make the `/` landing page look more professional (Upwork + Fiverr level polish).
2. Fix the post-signup / post-login flow so a **buyer** (looking for a pro) and a **seller** (wants to offer a service) never get mixed up — with a dedicated "Become a seller" page like `fiverr.com/start_selling`.

---

## Part 1 — Landing page polish (`/`)

Keep the same sections (hero, intent split, categories, how-it-works, trust, CTA, footer) but level up the craft:

- **Hero**: real editorial layout — large display headline, one supporting sentence, big search bar with category dropdown + "Search" button, popular tags as pill chips, trust badges row (rating · secure payments · verified pros · Mobile Money). Soft brand-tinted gradient background instead of flat.
- **Category rail**: replace generic tiles with image-backed cards (one hero image per vertical: beauty, tutors, artisans, events, church, digital, music, influencers). Rounded 2xl, subtle shadow, hover lift. Show a "starting from" price hint per category.
- **Intent split**: two premium cards ("I need a pro" / "I want to offer a service") with icon, 2-line value prop, primary CTA button. Cards use design tokens, not raw colors.
- **How it works**: 4 numbered steps with icons, connected by a thin divider line on desktop.
- **Social proof strip**: "Trusted by X pros across Africa" + logos/avatars row.
- **Final CTA**: dark section with dual buttons ("Find a pro" · "Start offering").
- **Footer**: 4-column footer (Categories / For clients / For pros / Company) matching the Fiverr-style reference — using existing routes.
- All spacing/typography tightened; consistent section rhythm; only semantic tokens (no hardcoded colors).

Files touched:

- `src/components/landing/MarketplaceHero.tsx`
- `src/components/landing/MarketplaceCategories.tsx` (add images + price hints)
- `src/components/landing/MarketplaceHowItWorks.tsx`
- `src/components/landing/LandingFinalCTA.tsx`
- `src/components/landing/LandingFooterCompact.tsx` (expand to 4-col)

---

## Part 2 — Proposed flow (buyer vs seller separation)

The rule: **the landing `/` is shared, but the entry action tells us who they are — and we never ask them again after signup.**

```text
                    siteviral.com  (shared landing)
                    ┌─────────────┴──────────────┐
        [Search / "I need a pro"]        [Top nav "Offer Services"]
                    │                              │
                    ▼                              ▼
              /looking-for                    /start-selling  ← new dedicated page
        (buyer onboarding: what,          (seller pitch: earnings, trust,
         where, budget, category)          categories, testimonials, CTA)
                    │                              │
             setIntent('client')            setIntent('provider')
                    │                              │
              /auth (signup/login) ─── returnTo ───┘
                    │
                    ▼
        DashboardRouter reads intent + existing account state:
        ─────────────────────────────────────────────────────
        • intent=client   → /discover (or last search)
                            never sees the "become a seller" onboarding
        • intent=provider → /start (goal picker) → vertical onboarding
        • existing user with a provider profile → /admin (skip everything)
        • existing user, buyer-only, returning  → /discover
```

Key rules that prevent confusion:

1. **Intent is captured before auth** (already implemented via `setIntent`). We just make sure both the hero search and every "Become a seller" CTA set it correctly.
2. `**/start-selling` is a real marketing page** (not the goal picker). It sells the seller value prop first, then the CTA takes them into `/start` (goal picker) once signed in. Mirrors `fiverr.com/start_selling`.
3. **Buyers never see seller onboarding**. `DashboardRouter` routes by `intent` + whether they already have a provider profile; if `intent=client` and no provider profile, we skip `/onboarding/type` and `/onboarding/goals` entirely.
4. **Sellers never see the buyer intent chooser**. If `intent=provider` we go straight into `/start` → vertical setup.
5. **Top nav shows the right CTA**:
  - Signed out: "Sign in" + "Become a seller" (dark button).
  - Signed in as buyer only: "Switch to selling" opens `/start-selling`.
  - Signed in as seller: "Go to dashboard".
6. **Existing users are protected**: if a user already has an org with a SiteViral type, we never re-prompt for intent, regardless of which button they clicked.

New/edited files:

- `src/pages/StartSellingPage.tsx` (new — Fiverr-style seller pitch page at `/start-selling`)
- `src/components/landing/LandingNav.tsx` (dark "Become a seller" button + smart signed-in CTA)
- `src/pages/DashboardRouter.tsx` (respect stored intent; buyer path skips onboarding)
- `src/App.tsx` (add `/start-selling` route)
- `src/components/landing/MarketplaceIntentSplit.tsx` ("I want to offer" now routes to `/start-selling`, not `/start`)

---

## Confirm before I build

Does this flow match what you want? Specifically:

- `**/start-selling` as a dedicated marketing page** (separate from the `/start` goal picker) — yes/no?
- **Buyers skip the SiteViral-type / goals onboarding entirely** — yes/no?

If yes, I'll ship Part 1 + Part 2 together.