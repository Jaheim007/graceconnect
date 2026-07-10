# Plan: Vertical separation, interest-driven dashboards, Explore polish

Big picture: SiteViral is a family of verticals (Digital, Beauty, Artisan (ex-Home), Events, Education/Influencers, Church, Others). Church is a **separate world** — never appears in "services you can find/offer". A user's dashboard nav must adapt to the verticals they said they're interested in on `/looking-for`. Explore must feel unified and professional across all verticals, not digital-first.

---

## 1. Remove Church from the services universe

- Remove Church from `/looking-for` interest chips (services picker).
- Remove Church from buyer Explore worlds (`buyerWorlds.ts` + `DashboardExplorePage` world switcher).
- Remove Church from `IntentChooserPage` / `WelcomeIntentPage` "what are you looking for" service options.
- Keep Church fully functional at `/church/*` — landing, onboarding, dashboard, giving. Untouched.
- Add a new entry point in `WelcomeIntentPage` and profile menu: **"Build my church platform"** → `/church/onboarding`. This is the *only* way Church surfaces in the general flow.
- Rename "Home" vertical to **"Artisan"** everywhere user-facing (FR: Artisan, EN: Artisan/Trades). Routes stay `/home/*` internally to avoid breakage; only labels + icons + copy change.

## 2. Add "Others" vertical to the picker

- Add a **"Other services"** / **"Autres"** chip on `/looking-for` and in Explore worlds so users with unlisted needs aren't stuck. Maps to a generic Explore feed (all verticals mixed, no filter).

## 3. Interest-driven adaptive sidebar

Today the buyer sidebar is fixed: Overview · My Purchases · Explorer · Earn. Extend it so extra items are appended based on `localStorage.sv_interests`:


| Interest  | Extra nav items appended                    |
| --------- | ------------------------------------------- |
| digital   | (none — base nav is already digital-shaped) |
| beauty    | My Appointments, My Orders                  |
| artisan   | My Requests, My Orders                      |
| events    | My Bookings, My Orders                      |
| education | My Sessions, My Tutors                      |
| other     | (none)                                      |


Deduped, capped so the sidebar stays: **Overview · My Purchases · Explorer · [interest items] · Earn · Profile (with logout)**. Never more than ~6 items.

Implementation: extend `getActionNavItems` with an optional `interests: string[]` param, read from `useBuyerWorld` / localStorage in `Sidebar.tsx` and `BottomNav`.

These are the different services that offere services:  
"Digital Products, Musicians / Instrumentists , Sport / Coach, Artisans, Influencers and these who want to offer any different kind of service"

## 4. Explore consistency pass

Problem: `/dashboard/explore` (default) and `/dashboard/explore?world=beauty` render with different layouts/spacing/typography — feels digital-first.

Fix in `DashboardExplorePage.tsx`:

- Wrap every world (Digital, Beauty, Artisan, Events, Education, Other) in the **same shell**: page header (world name + short subtitle + world switcher chips) → optional "For you" mixed strip (only on default view) → world grid.
- Normalize card component: reuse one `ExploreCard` across verticals (image/emoji, title, subtitle, price/CTA slot).
- Ensure spacing, container width, and typography match the digital variant (which is the current baseline).
- Default (no `?world=`) view: keep the multi-interest "For you" hub, but each interest section uses the same card grid — no more digital-only wall.

## 5. Welcome / intent flow copy

- `/welcome-intent`: three cards →
  1. **I'm looking for a service** (buyer) → `/looking-for`
  2. **I want to offer a service** (seller) → existing seller path
  3. **I want to build my church platform** → `/church/onboarding`
- Church chip removed from `/looking-for`.

---

## Technical touch points

- `src/pages/LookingForPage.tsx` — remove church chip, add "other".
- `src/pages/WelcomeIntentPage.tsx` — add church-platform CTA.
- `src/pages/IntentChooserPage.tsx` — mirror the above.
- `src/lib/siteviral/buyerWorlds.ts` — drop church, add "other".
- `src/pages/dashboard/DashboardExplorePage.tsx` — unified shell, dedup card layouts, keep For-You hub.
- `src/lib/navigation/actionNavItems.ts` — accept `interests` and append per-interest items.
- `src/components/layout/Sidebar.tsx` + `BottomNav.tsx` — pass interests through.
- `src/components/layout/TopBar.tsx` — profile menu keeps "Create a platform" (unchanged) + logout below.
- Rename Home → Artisan labels in nav items and world labels only (no route changes).

## Out of scope (call out, don't do)

- No DB migration — interests still live in `localStorage.sv_interests` (per prior decision).
- No changes to `/church/*` internals.
- No new backend endpoints.