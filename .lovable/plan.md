# Step 1 — Foundation: explicit Personal context

## Goal

Turn today's implicit buyer mode (`currentOrg === null`) into a first-class, user-visible **Personal** space, without touching the database and without breaking any existing workspace/org behavior.

Personal is a pure client-side concept:
- `currentOrg === null` **means** "Personal" everywhere in the UI.
- Every existing organization keeps working exactly as it does today.
- The user can switch between Personal and any of their workspaces from a single place.

## Assumptions (please correct if wrong)

- Personal never appears in `organizations` or `organization_members` — no migration, no RLS change.
- "Personal" label is per-user only. Avatar = user avatar, name = user's display name / email.
- Switching to Personal simply calls `setCurrentOrg(null)` and lands the user on `/dashboard` (which already renders the buyer-side `UserDashboard` when there is no org).
- We keep the current `OrgSwitcher` component and extend it. We do **not** introduce a parallel state system.

## Scope of Step 1 (only this)

1. Introduce a `PERSONAL` sentinel in the switcher layer (not in `OrgContext` state).
2. Make `OrgSwitcher` always render, list **Personal first**, then managed workspaces, with a clear active state on whichever is current.
3. Persist "Personal" as an explicit choice in `localStorage` so a refresh doesn't silently re-select the first org.
4. Adjust the sidebar so the switcher is visible for all authenticated users (today it's hidden when `!hasOrgs || !canManageCurrentOrg`).
5. Add a tiny helper `useCurrentSpace()` returning `{ kind: 'personal' | 'org', org, label, avatarUrl }` so future steps have one place to read "what space am I in".

Everything else (nav restructure, unified `/messages`, `/orders`, search-first Home, sectioned "My Spaces" groups, landing intent-routing) is **out of scope** for Step 1.

## Changes

### A. `src/contexts/OrgContext.tsx` — persist Personal explicitly

- Change the localStorage key contract:
  - `sv_current_org_id = "<uuid>"` → an org is selected
  - `sv_current_org_id = "__personal__"` → Personal explicitly chosen
  - key absent → no choice yet (first-run behavior below)
- In `setCurrentOrg(null)`, write `"__personal__"` instead of `removeItem`.
- In the restore effect:
  - if saved === `"__personal__"` → keep `currentOrg = null` and mark `restoredRef = true`; **do not** auto-pick the first org.
  - if saved is a uuid that matches → select it (unchanged).
  - if nothing saved:
    - user has 0 managed orgs → stay Personal (`null`), write `"__personal__"`.
    - user has managed orgs → keep current behavior (pick first) — this preserves today's UX for existing owners.
- On sign-out, clear the key (already does).

No changes to the `OrgContextType` shape. No changes to queries, RLS, or org membership logic.

### B. `src/hooks/useCurrentSpace.ts` (new, ~30 lines)

```ts
export type CurrentSpace =
  | { kind: 'personal'; id: 'personal'; label: string; avatarUrl?: string | null }
  | { kind: 'org'; id: string; label: string; avatarUrl?: string | null; org: Organization };
```

Derived from `useAuth()` + `useOrg()`. Pure read helper — no state. Used by the switcher and any future component that needs to render "current space".

### C. `src/components/org/OrgSwitcher.tsx` — add Personal row

- Remove the early `if (!currentOrg || userOrgs.length === 0) return null;` guard. Component now always renders for signed-in users.
- Build the list as: `[PersonalRow, ...managedOrgs]`.
- `PersonalRow`:
  - Avatar = user avatar (fallback initials from email).
  - Title = "Personal" / "Personnel".
  - Subtitle = user's email or display name.
  - Active state when `currentOrg === null`.
  - `onSelect` → `setCurrentOrg(null)` + `navigate('/dashboard')` + close.
- Trigger button (`sidebar` and `topbar` variants) reads from `useCurrentSpace()` so it can display "Personnel" with the user avatar when in Personal mode instead of the org card.
- Keep the existing "Create a new workspace" footer button unchanged.
- Keep the `managedOrgs.length === 0` empty-state CTA, but render it **inside** the dialog under the Personal row instead of returning early.

### D. `src/components/layout/Sidebar.tsx` — always show the switcher

Replace:
```
{hasOrgs && canManageCurrentOrg && (
  <div className="px-2 pt-2"><OrgSwitcher variant="sidebar" collapsed={collapsed} /></div>
)}
```
with an unconditional render for authenticated users:
```
{user && (
  <div className="px-2 pt-2"><OrgSwitcher variant="sidebar" collapsed={collapsed} /></div>
)}
```
No other Sidebar logic changes in Step 1 (nav items, buyer-world block, etc. stay as-is).

### E. `src/components/layout/TopBar.tsx` — mirror the same trigger

`OrgSwitcher variant="topbar"` already renders on mobile; drop its internal "hide when no managed orgs" branch by relying on the same always-render path from step C. No other TopBar changes.

## Explicitly NOT changing in Step 1

- No database migration, no new tables/columns, no RLS edits.
- No changes to `AuthCallbackPage`, `useUserKind`, `useUserProfile`, `RouteGuard`, `BottomNav`, `DashboardRouter`, or any vertical route.
- No sectioning ("Personal / Businesses / Organizations") — that lands in Step 2 along with the "My Spaces" screen.
- No changes to landing, `/dashboard/explore`, `/looking-for`, or intent flow.

## Acceptance criteria

1. A signed-in user with **zero** organizations sees the switcher showing **Personal (active)** and a "Create a workspace" CTA. Refresh keeps them on Personal.
2. A signed-in user with one or more workspaces sees Personal listed above their workspaces. They can switch to Personal, land on `/dashboard` (buyer view), refresh, and stay in Personal.
3. Switching from Personal → an org still calls `setCurrentOrg(org)` and behaves exactly like today (React Query invalidation, navigation to `/dashboard`).
4. No existing owner/admin loses access to any current workspace, dashboard, or route. No console errors from `currentOrg` being null in places that already tolerate it.
5. `localStorage.sv_current_org_id` is either a uuid or `"__personal__"` — never absent for a signed-in user who has interacted with the switcher.

## Technical notes

- The `"__personal__"` sentinel is a magic string chosen to be an invalid uuid so it can never collide with a real `organizations.id`.
- `useCurrentSpace()` intentionally does not memoize the org object beyond what `OrgContext` already provides — it's a thin adapter, not a new source of truth.
- All labels go through `useI18n()` (`isFr` pattern already used in `OrgSwitcher`/`Sidebar`).

## Follow-ups (for later steps, not now)

- Step 2: sectioned "My Spaces" (Personal / Businesses / Organizations) + dedicated `/spaces` page.
- Step 3: buyer nav restructure (Home / Messages / Orders / Profile) and Earn tucked under Profile.
- Step 4: unified `/messages` and `/orders` across verticals.
