# A→Z flow: closing pass

Short answer: the structural simplification is done. One dashboard, one library, one creation engine, one route per job, and the legacy paths now redirect instead of duplicating screens. What's left is not more restructuring — it's proving the flow works end to end for a real signed-in user, and cleaning the last few rough edges.

## What remains

### 1. End-to-end verification with a real session
The authenticated half of the flow has never been walked through automatically. Walk it manually/scripted once and record the result:

- Sign up fresh → intent step (Learn / Sell / Create) → dashboard shows the matching first action
- Guest checkout → success screen → "Save it to my library" → sign in with the pre-filled email → the purchase appears in the library
- Create a course → publish → it shows on Discover → buy it from a second account → it appears in that account's library with progress
- Unpublish / delete → buyers keep access, the item leaves Discover

Anything that breaks here becomes the actual next task list.

### 2. Dead-end audit on the authenticated side
The public routes were audited; the signed-in surfaces were not. Sweep every dashboard, settings, library and church/creator page for links that point at retired routes, and for empty states with no action button.

### 3. Copy and language consistency
The flow now mixes English and French labels in places (library tabs, giving vs campaigns, action hub items). Pass over the labels the user actually sees in a single language per session, driven by the existing i18n hook.

### 4. Nothing new to build
No new pages, no new routes, no new engines. If verification is clean, the simplification is complete and the next phase should be about growth surfaces (Discover quality, activation emails performance), not structure.

## Technical notes
- Verification uses Playwright against the running dev server with the injected Supabase session where available; steps that need a second account are done manually.
- Fixes found during the sweep are applied in place (link targets, empty-state CTAs, label lookups) — no route additions.
- The daily `activation-engine-daily` cron stays as-is; its output is reviewed after the first week of real sends.
