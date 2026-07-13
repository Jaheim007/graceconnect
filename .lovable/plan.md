# Low-friction navigation: one account, workspaces only for managing

## Product change

Today the UI treats "Personal" as a peer workspace users must select. That forces a mode choice on every session (Personal ↔ Org) and complicates every screen. New model:

- **One SiteViral account per user.** Global actions (Home, Explore, Messages, Orders, Profile, Earn, etc.) are always available — they never depend on which workspace is active.
- **Workspaces exist only to manage a business/organization/church.** The selector answers a single question: "Which business/org do you want to manage?" It never offers "Personal" as a choice.
- **A user with zero workspaces** sees the full customer app and a single "Create a workspace" CTA in the switcher area. No mode toggling.
- **A user with one or more workspaces** sees the same customer app; the switcher only appears in *management* surfaces (sidebar admin area / TopBar chip) and picks which one to admin. Switching a workspace changes only the `/admin/*` context, not the global nav.

All existing data — users, `organizations`, `organization_members`, purchases, courses, messages, auth, payments, provider modules — is preserved. No DB migration.

## Scope

Frontend/presentation only. No backend, RLS, or provider taxonomy changes.

## Changes

### 1. `OrgSwitcher.tsx` — remove Personal row
- Delete the `PersonalRow`, `handleSelectPersonal`, "My space" section, and "Personnel + N workspace(s)" copy.
- Dialog title becomes "Choose a workspace to manage" / "Choisir un espace à gérer".
- Body lists only `managedOrgs` (owner/admin). If empty → prominent "Create your first workspace" empty-state card.
- Trigger button:
  - When `currentOrg` exists → shows org name + logo (as today).
  - When `currentOrg` is null → shows a compact "Manage a workspace" chip (or "Create workspace" if none exist). Clicking opens the dialog.
- Never renders "Personnel" anywhere.

### 2. `OrgContext.tsx` — drop the `__personal__` sentinel
- Remove the special-case for `"__personal__"` in the restore effect and in `setCurrentOrg`.
- New behavior:
  - `currentOrg = null` is the normal default state; it just means "no workspace being managed right now".
  - Restore: if saved uuid matches a membership → select it. Otherwise leave `currentOrg = null`. Do **not** auto-pick the first org anymore — the user is in "customer" mode by default, and picks a workspace explicitly when they want to manage one.
  - `setCurrentOrg(null)` → `localStorage.removeItem('sv_current_org_id')`.
  - `setCurrentOrg(org)` → stores the uuid (unchanged).
- `isLoadingOrgs` simplifies: no longer waits for a workspace to be picked.
- Existing owners who previously auto-landed in their org are unaffected on subsequent visits because `sv_current_org_id` is already persisted from earlier sessions. First-time-after-change: they'll land in customer mode once, then pick their workspace from the switcher (one-time).

### 3. `useCurrentSpace.ts` — retire "Personal" branch
- Change the return to only report an org space or `null`:
  ```ts
  export type CurrentSpace = { kind: 'org'; id: string; label: string; ...; org: Organization } | null;
  ```
- Consumers that used the personal branch fall back to reading `user`/`profile` directly (already how the sidebar profile card works). Export a small helper `useAccountIdentity()` for those spots (name/avatar/email from `useAuth`), so we don't re-check `space.kind === 'personal'` all over the app.

### 4. `GlobalBottomNav.tsx` + `PersonalBottomNav.tsx` — one customer nav
- `PersonalBottomNav` is now the default customer bottom nav for every signed-in user who isn't inside a vertical provider surface OR `/admin/*`.
- Remove the `!currentOrg` gate. Signed-in users in a workspace still get the customer bottom nav on customer pages; they only see the admin surface (which has its own layout, no bottom nav) when navigating there.
- Rename the file/component from `PersonalBottomNav` → `CustomerBottomNav` to match the new mental model (keep a re-export shim for one migration cycle if needed).

### 5. `DashboardRouter.tsx` — `/dashboard` is customer home
- Always render `PersonalHome` (customer home) at `/dashboard`.
- The existing `UserDashboard` (org overview) moves to `/admin` (already the admin shell root). Add a small redirect so `currentOrg` no longer causes `/dashboard` to swap layouts.
- Result: `/dashboard` is stable and does not change based on which workspace is selected. To manage a workspace the user goes to `/admin` (which honors `currentOrg`).

### 6. `Sidebar.tsx` — switcher only in management context
- On customer pages: sidebar shows global nav + a small "Manage a workspace" entry that either lists existing workspaces in a popover (if any) or shows a "Create workspace" CTA.
- On `/admin/*`: sidebar shows the `OrgSwitcher` at the top (as today), plus admin nav.
- Remove `hasOrgs && canManageCurrentOrg` guard duplication; use route prefix instead.

### 7. `authRedirect.ts` + `useNewUserRedirect.ts` — no forced org pick
- Remove any branch that "returns to last org" implicitly. Post-auth default lands on `/dashboard` (customer home). If the user came from a workspace CTA (`intent = provider`), we still send them to `/admin` or `/start`.

### 8. `AddOrNewWorkspaceDialog.tsx`, `ShortcutRedirect.tsx`, `AdminShell.tsx`
- Copy adjustments where the current wording says "Personal" or implies a mode toggle.
- `AdminShell` empty-state changes to a single primary CTA "Create your first workspace" (was two paths).

### 9. i18n copy
- Replace all "Personnel / Personal" workspace strings with either the account owner's name (for identity spots — profile chip, greetings) or "workspace" language (for management spots).
- Retain "Personal" nowhere in UI. Keep sentinels/keys as strings inside code only, unused.

## Preserved (explicitly not changed)

- `auth`, sign-in, callback, session recovery.
- `organizations`, `organization_members`, RLS, all data queries.
- Purchases, orders, courses, messages, payments, KYC.
- Provider modules (Beauty, Church, Home, Events, Education, Digital) and their vertical routes.
- Category routes and public marketing pages.

## Acceptance

1. Signed-in user with zero orgs: no mode toggle anywhere. Sidebar + bottom nav are the customer app. Single "Create a workspace" CTA.
2. Signed-in user with N orgs: same customer app on all customer routes. `/admin/*` shows the OrgSwitcher; picking a workspace only changes admin context.
3. "Personal" no longer appears in any label, dialog, or nav.
4. Existing users retain access to every workspace, purchase, and provider surface.
5. Refreshing keeps the last-managed workspace selected for `/admin/*` (via existing `sv_current_org_id`).
6. Typecheck passes.

## Follow-ups (not now)

- Consolidate "My workspaces" management page under `/admin` (list + create + settings).
- Deprecate `useCurrentSpace` entirely once callers stop needing a unified adapter.
