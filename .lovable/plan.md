# Siteviral: The Multiverse Model

## The vision (recap in plain words)

Siteviral is **one universe** with several **worlds**: Digital, Beauty, Church, Home services, Events, Education. Every user is one of three types:

1. **Providers** — offer a service (sell digital products, cut hair, teach, cater events, pastor a church…)
2. **Explorers / buyers** — browse, purchase, book, affiliate, read. No workspace needed.
3. **Hybrid** — started as one, wants to add another world later.

The rule: **one workspace = one primary world**, but any other world can be **activated later** from Settings → Modules without creating a second workspace. Nobody is ever *blocked* from a world — it's just not shown until they turn it on.

## What the user sees

### A. Landing (siteviral.com)
Two clear doors:
- **"I want to offer a service"** → world picker → workspace creation
- **"I'm looking for a service / to explore"** → discover feed, no workspace required

(This already exists as `IntentChooserPage` — we just make it the real front door and clean the copy.)

### B. Workspace creation — the world picker
Replace the current "creator / organization / brand" question with:

> *What kind of platform do you want to build?*
>  ◻ Digital products & courses
>  ◻ Beauty services
>  ◻ Church / ministry
>  ◻ Home services (artisans)
>  ◻ Events (vendors)
>  ◻ Education / tutoring

The chosen world becomes the workspace's `primary_world`. That's the ONLY thing that changes the default sidebar + default modules.

### C. Dashboard — one screen, world-aware
A single `UnifiedDashboardLayout` (already exists). The sidebar is built from three layers:

```text
┌──────────────────────────────────────┐
│ 1. Universal items                   │  Overview, Purchases, Explore,
│    (every authed user)               │  Claim, Revenue, Settings, Sign out
├──────────────────────────────────────┤
│ 2. Primary-world defaults            │  Digital → Sell, Write a book, Promotions
│    (from workspace.primary_world)    │  Beauty  → Bookings, Messages, Availability
│                                      │  Church  → Sermons, Offerings, Team, Events
│                                      │  Home    → Jobs, Messages, Availability
│                                      │  Events  → Packages, Bookings, Messages
│                                      │  Educ.   → Sessions, Messages, Subjects
├──────────────────────────────────────┤
│ 3. Activated modules                 │  Only appear when toggled ON in
│    (from feature_activations)        │  Settings → Modules
└──────────────────────────────────────┘
```

Nothing else pollutes the sidebar. That fixes the current over-saturation problem for good.

### D. Settings → Modules — the activation matrix
Two sections in the Modules tab:

1. **Extra features for your current world** — e.g. Digital: CRM, Community, Order generator, Affiliation, Coupons, Bundles, Reviews… (all OFF by default)
2. **Add another world to this workspace** — e.g. a Beauty workspace can turn ON "Sell digital products", which adds the digital default sidebar block to their existing dashboard.

Turning a world ON = inserts its default sidebar block (layer 2) below the primary one. Turning it OFF = removes it. Data persists.

### E. Explorers (no workspace)
Their dashboard shows only: Overview, My purchases, Explore, Claim (affiliate), Revenue (partner earnings), Settings, Sign out — plus a big **"Create a platform"** CTA that opens the world picker.

## Technical plan

### 1. Data model
- Add `organizations.primary_world` enum: `digital | beauty | church | home | events | education` (backfill from existing `type`/`vertical` columns; they already exist under different names — audit `siteviral/config.ts`).
- Reuse existing `feature_activations` table for module toggles. Add a `world` column so we can list activations grouped by world in the UI.

### 2. Sidebar builder — single source of truth
Refactor `src/lib/navigation/featureNavBuilder.ts` into three pure functions:
```
buildUniversalItems(user)          // layer 1
buildWorldDefaults(primaryWorld)   // layer 2
buildActivatedModules(activations) // layer 3
```
`UnifiedDashboardLayout` concatenates them in that order. Delete every ad-hoc override currently in that file.

### 3. World picker
- Rewrite `CreateOrgPage` step 1 as the 6-world grid above.
- Store choice in `organizations.primary_world`.
- Seed default `feature_activations` rows for that world.

### 4. Settings → Modules
- Extend `dashboardModules.ts` with a `world` field on each module.
- `ModulesSettings.tsx`: two tabs, "This world's extras" and "Other worlds".
- Toggling writes to `feature_activations`; sidebar re-renders reactively.

### 5. Landing / intent
- Make `IntentChooserPage` the destination of the header "Join / Sign in" for logged-out users.
- Logged-in users go straight to `/dashboard`.
- Explorer path never forces workspace creation.

### 6. Route hygiene
Every sidebar item resolves to a real route already registered in `App.tsx`. No `/dash/*` alias layer needed if we just point items at their real routes.

## Out of scope for this pass
- Real-time messaging + order-via-message (Tracks 3 & 4 from the previous plan) — do those *after* the multiverse skeleton lands, once every world has a "Messages" module slot.
- No migration of existing per-vertical tables (`beauty_*`, `church_*`, …). They stay as-is; the sidebar just points at them.

## Questions before I build

1. **Primary world switch.** If a user later realizes they picked the wrong primary world, should we allow changing `primary_world` from Settings, or is it locked once chosen (they can only *activate* other worlds alongside it)?
2. **Explorer "Revenue" item.** For a pure explorer (no workspace, no partner account), should Revenue be hidden until they earn something, or always visible as an empty state pointing to the affiliate program?
3. **World picker copy.** OK with the 6 labels above (Digital products & courses / Beauty services / Church & ministry / Home services / Events / Education & tutoring), or do you want different wording?
