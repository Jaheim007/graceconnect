# A→Z flow: the last mile

The core simplification is done (one dashboard, one library, one creation engine, one route per job). Three real gaps remain, one of them a live bug.

## 1. The intent picker is unreachable (bug)

Verified in the code:

- `/welcome-intent` redirects away, and `/looking-for` also redirects to `/dashboard` because the service marketplace is switched off.
- `WelcomeIntentPage` is the only screen that calls `setOnboardingIntent`, so the intent is never set.
- Consequence: the first-run hero and the dashboard block ordering always fall back to a generic default.
- Two places still link to `/looking-for` (dashboard layout nav, Explore "For you" header) — both are silent dead ends today.

Fix:
- Make a digital-first intent step reachable right after signup, with three choices: **Learn something**, **Sell my content**, **Create a space**.
- Store the choice, then send the user straight to the matching destination (library, dashboard with sell-first ordering, or platform creation).
- Remove or repoint the two dead `/looking-for` links while service surfaces are off.

## 2. Public marketing surfaces overlap

`/landing`, `/about` and `/features` each act as "the page that explains SiteViral". Keep `/landing` as the single explanation page, fold the unique content of the other two into it, and turn them into redirects. The `/pour/*` audience pages stay — they serve a different job (SEO landing per audience).

## 3. Authenticated end-to-end verification

The buyer path has never been walked end to end in one pass. Verify, and fix whatever breaks:
- Guest checkout → success screen → pre-filled magic-link sign-in → purchase appears in the library.
- Brand-new account → first-run hero matches the chosen intent.
- Creator path → create a platform → publish → item visible on Discover.
- Both 390px and 1280px.

## Technical notes

- Intent step: reuse `OnboardingShell`, `onboardingIntent.ts` (`setOnboardingIntent`), and the existing ordering hook in `PersonalHome.tsx`. Gate the buyer-interest variant behind `showServiceSurfaces()` so nothing regresses when the marketplace comes back.
- Route changes in `src/App.tsx` only; no new pages beyond the intent step.
- Verification uses the browser against the running preview; report findings with screenshots.

## Not included

No new features, no design overhaul, no changes to payments, AI generation, or workspace logic.
