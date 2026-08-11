# A→Z flow: what's left

The structural simplification is done: one adaptive dashboard, one library with tabs, one creation entry (`/create-org`), guest-purchase claiming at login, retired duplicate pages, and the daily activation email schedule. What has **not** been done is proving the whole path works end to end on a real device, and cleaning the last few loose ends visible in the route table.

So the answer is: nothing big is missing in architecture. What remains is verification plus small polish.

## 1. End-to-end verification pass (the real remaining work)

Walk each path in a real browser (mobile 390px and desktop) and capture what actually happens, then fix only what breaks:

- Visitor: `/` Action Hub → Discover → open a product → guest checkout → success screen → "Save it to my library" → magic-link sign-in → item appears in library.
- New signup: sign up → intent question → dashboard first-run hero → do the suggested first action.
- Creator: create platform → create a course (AI) → publish → appears in Discover → buy from another account.
- Church: create church space → sermon + Giving page → public church profile → give.
- Returning buyer: library tabs (Books / Courses / Giving / Receipts) → resume a course → certificate → public verification page.

Each broken step becomes a small targeted fix in the same pass, not a redesign.

## 2. Loose ends in the route table

- Legacy service verticals (`/beauty/*`, `/home/*`, `/events/*`, `/learn/*`, `/education/*`) still carry long alias chains behind `HiddenSurface`. Collapse each vertical to a single guarded entry plus one catch-all redirect, removing ~60 dead alias routes.
- Several `/pour/*` persona pages and `/showcase`, `/temoignages`, `/comparer` are public but unlinked from the current landing/nav. Either link them from the landing footer or retire them so the public surface matches the nav.
- `/digital/about`, `/a-propos` and `/landing` all render the same landing page. Keep `/landing` as canonical and redirect the other two.

## 3. Guardrails so it stays simple

- Add a short "one route per job" note to project memory so future work doesn't reintroduce parallel dashboards or a second library.
- Verify the activation email schedule actually fired once (check the job run + one sent email) rather than assuming.

## Technical notes

- Verification uses Playwright against the local dev server with a restored session; screenshots per step.
- Route collapsing is confined to `src/App.tsx` plus any internal links found by search; no page component logic changes.
- No database or edge-function changes are needed for this phase except reading the cron/email logs.
