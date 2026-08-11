# A→Z flow simplification — final remaining item

The user-facing flow work is done: one route per job, unified dashboard, unified library with tabs, guest-purchase claiming, intent capture, activation ladder + daily cron, zero dead links (scripted audit), verified at 390px and 1280px.

One structural leftover remains, plus verification I cannot do myself.

## What is left

### 1. Retire the hidden service-marketplace routes from the main router
`SERVICE_MARKETPLACE_ENABLED` is `false` in `src/lib/siteviral/visibility.ts`, yet `src/App.tsx` is still 953 lines and ~412 route entries, most of them Beauty / Home / Events / Education screens that always resolve to a redirect today. Every one of those pages is still imported by the main router.

Change: move the hidden-vertical route trees (`/beauty/*`, `/home/*`, `/events/*`, `/learn/*`, `/education/*`) into a single `HiddenVerticalRoutes` module that is only mounted when the flag is on. When the flag is off, the router keeps one catch-all redirect per vertical to `/dashboard`.

Result: the flag stays the single switch, no page or table is deleted (the code and data are preserved as documented), the main route table drops to the routes that actually serve the product, and the hidden screens stop being pulled into the app graph.

### 2. Signed-in end-to-end pass (needs you)
This project uses an external Supabase that Lovable cannot mint a session for, so these paths need a manual run-through:
- signup → intent → unified dashboard
- guest checkout → sign in → purchase claimed into the library
- publish a course → buy it → progress shows in the library

Tell me what breaks and I will fix it.

## Technical notes
- New file `src/routes/HiddenVerticalRoutes.tsx` holding the flagged trees, lazy-loaded so it is code-split out when disabled.
- `src/App.tsx`: replace the per-vertical route blocks with the flag check plus fallback redirects; keep `HiddenSurface` for any individual legacy path that must stay reachable by direct URL.
- No changes to `visibility.ts` semantics, marketplace tables, or workspace logic.
