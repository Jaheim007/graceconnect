
# Unified Flow Plan — SiteViral (Fiverr-style)

## Goal
Kill the per-vertical "Action Hub" splash pages (Beauty "Que veux-tu faire?", Events "Ton événement sans stress", etc.). Everyone lands on the same SiteViral landing page. Sign-in goes straight to one unified dashboard. Role (client vs. provider) is chosen during onboarding, not on a splash screen.

---

## 1. Public site (guest, not signed in)

**Landing (`/`)** — single entry point for everyone.
- Hero: "Find any service" + search
- Categories grid (Beauty, Events, Home, Education, Church, Digital) → each links to a Fiverr-style **category browse page** (`/category/:slug`), NOT to an Action Hub
- How it works, testimonials, FAQ
- Pricing moves to the **bottom** of landing (or `/pricing` linked from footer), not in the top nav

**Nav (guest):**
- Explore (browse all)
- Offer a service
- Sign in / Join

**Category pages (`/category/:slug`)** — Fiverr-style:
- Sub-categories, featured providers, listings
- Anyone can browse freely; clicking "Book" / "Contact" prompts sign-in

**Removed / redirected:**
- `/beauty`, `/events`, `/home`, `/education`, `/church`, `/digital` Action Hub landings → redirect to `/category/<slug>`
- The 3-choice splash ("Explorer / Prendre RDV / Proposer mes services") is deleted everywhere

---

## 2. Auth

- **Sign in** → straight to `/dashboard` (no splash, no role picker for existing users)
- **Join** → email/password → onboarding step 1 (role choice)

---

## 3. Onboarding (new account only)

Step 1 — **"Are you here to hire, or to offer services?"**
- **I'm a client** → minimal profile (name) → `/dashboard` (client mode)
- **I want to offer services** → provider onboarding:
  1. Name, email confirm
  2. Pick service categories they'll offer (multi-select across all verticals)
  3. Short bio + location
  4. → `/dashboard` (provider mode)

"Offer a service" button in nav routes guests to Join, then jumps them into step 1 pre-selected on "provider".

---

## 4. Unified dashboard (`/dashboard`)

One route, two modes stored on `profiles.account_mode` ('client' | 'provider'). Toggle in header lets a user switch (a provider can also be a client).

**Client mode:**
- Search services, saved providers, active bookings, messages, past orders

**Provider mode:**
- Orders queue, calendar, messages, listings/gigs, earnings, profile completion

Both modes share: messages, notifications, settings, account switcher.

---

## 5. What gets deleted

- `src/pages/BeautyPage.tsx`, `EventsPage.tsx`, `HomePage.tsx`, `EducationPage.tsx`, `ChurchPage.tsx`, `DigitalPage.tsx` Action Hub variants (the 3-tile splash)
- `StartSellingPage.tsx` splash → replaced by direct route into onboarding step 1 with role=provider
- `LookingForPage.tsx` (already partly gone)
- Per-vertical duplicate dashboards → merged into `/dashboard`

Category browse pages are kept/created under `/category/:slug`.

---

## 6. Technical notes

- Add `account_mode` column to `profiles` ('client' default, 'provider' after onboarding); providers can hold both — use a `provider_profiles` row to gate provider features
- Route guard: `/dashboard` requires auth; unauth → `/auth`
- Redirects added in `App.tsx` for old vertical hub URLs → `/category/<slug>` (preserves SEO / old links)
- Nav simplified to: Explore · Offer a service · Sign in / Join
- Footer holds: Pricing, About, Categories, Legal

---

## Rollout order

1. Add `/category/:slug` browse page + redirects from old hub routes
2. Rewrite nav + landing (pricing moved down)
3. Build onboarding role picker + provider onboarding wizard
4. Merge dashboards into unified `/dashboard` with mode toggle
5. Delete obsolete Action Hub pages
6. Migration: add `account_mode` to `profiles`, backfill existing users to 'provider' if they have a provider_profile row, else 'client'

Reply **"go"** to start, or tell me what to change (e.g. "skip the migration for now", "keep /beauty as a marketing page", "start with step 3 first").
