
## Goal

There must be ONE signed-in shell (AppLayout + professional dark-navy Sidebar + TopBar) for every authenticated route. No "Personal" sidebar, no `PersonalBottomNav` on customer routes, no detached full-width pages for Purchases/Programs/Earn. The same sidebar shows two grouped sections: **ACCOUNT** (Explore, My Purchases, My Programs, Messages, Earn) and **WORKSPACE** (workspace-specific tools when a workspace is selected).

## Changes

### 1. Move detached pages into the unified shell (`src/App.tsx`)
- Remove standalone `<Route path="/gagner" element={<GagnerPage />} />` and re-add it under the `<AppLayout />` route group as `RequireAuth`.
- Same for `/ecrire`, `/vendre`, `/creer-formation` when signed-in (keep public variants unauth via AdaptiveLayout only if guest — but since these are hybrid, wrap them inside AppLayout when authed by routing through a wrapper that omits AdaptiveLayout's chrome for signed-in users). Simplest: strip `AdaptiveLayout` from GagnerPage and mount route inside AppLayout.
- Ensure `/my-purchases`, `/my-programs`, `/dashboard/explore`, `/dashboard/messages` render inside AppLayout (already are for programs/explore/messages; `/my-purchases` currently sits outside — move it inside the AppLayout route group and drop the standalone `<Route path="/my-purchases">` at line 601).

### 2. Rewrite `Sidebar.tsx` — one professional sidebar for all routes
- Remove the route-aware split between "customer sidebar" and "workspace sidebar". Always render the professional dark-navy workspace-style sidebar.
- Top: workspace switcher card (`OrgSwitcher`) — shows current workspace or "Create workspace" CTA when none.
- Group **ACCOUNT** (always visible): Explore (`/discover`), My Purchases (`/my-purchases`), My Programs (`/my-programs`), Messages (`/dashboard/messages`), Earn (`/gagner`).
- Group **WORKSPACE** (only when `currentOrg`): Overview (`/admin`), plus module items from `featureNavBuilder` filtered to exclude Promotion, Claim, My Purchases, My Programs (already done). Include Revenue, Settings.
- Bottom: Sign out.
- Same styling for desktop and mobile drawer. Remove `PersonalSidebarNav` usage.

### 3. Kill `PersonalBottomNav` on customer routes
- In `GlobalBottomNav.tsx`, replace the `PersonalBottomNav` branch with a compact unified bottom nav: Overview, Explore, Purchases, Messages, Menu (opens the full Sidebar as a Sheet drawer). Same shell everywhere; consistent with sidebar IA.
- Vertical provider surfaces keep their existing vertical `BottomNav`.

### 4. Copy cleanup
- `src/i18n/locales.ts`: replace `'page.dashboard_desc'` "Your personal overview…" and `'tour.dashboard_1_title'` "Your personal overview" with account/workspace-neutral wording ("Your SiteViral overview" / "Votre tableau SiteViral").
- `PersonalHome.tsx`: audit and remove any "personal space / espace personnel" copy in headings/subtitles.
- Keep filenames (`PersonalHome`, `PersonalActivityPage`, `PersonalMessagesPage`, `PersonalBottomNav`) as internal artifacts — no visible "Personal" wording.

### 5. Avatar menu simplification (`TopBar.tsx`)
- Remove Explore / My Purchases / My Programs / Earn from the avatar dropdown (they now live in the sidebar).
- Keep: Profile, Billing & invoices, Appearance, Create workspace, Switch/manage workspace, Account settings/security, Sign out.

### 6. Workspace preservation
- `OrgContext` already preserves `currentOrg` across route changes — no change needed. Verify `AdminShell` no longer auto-clears.
- Login/redirect priority (pending action → last route → `/dashboard`) already handled by `useNewUserRedirect` + `AuthCallbackPage`.

### 7. Ensure `/admin` copy uses workspace name, not "personal space"
- `AdminShell` empty state already workspace-worded. Audit `UserDashboard` briefly for any residual "personal" copy.

## Explicitly out of scope in this pass
- Full Favorites/Wishlist consolidation into a single `/saved` page. Data preserved; old direct sidebar entries already removed. Will report as remaining gap.
- Native mobile shell (Capacitor) — unchanged.

## Files to touch
- `src/App.tsx` — move `/my-purchases` and `/gagner` into `AppLayout` group.
- `src/pages/GagnerPage.tsx` — remove `AdaptiveLayout` wrapper (page becomes route child of AppLayout).
- `src/components/layout/Sidebar.tsx` — one unified sidebar with ACCOUNT + WORKSPACE groups.
- `src/components/layout/GlobalBottomNav.tsx` — unified compact bottom nav, drop `PersonalBottomNav` branch.
- `src/components/layout/TopBar.tsx` — trim avatar menu duplicates.
- `src/lib/navigation/actionNavItems.ts` — expose an `ACCOUNT_NAV_ITEMS` array used by both Sidebar and BottomNav.
- `src/i18n/locales.ts` — 2 string edits.
- `src/pages/dashboard/PersonalHome.tsx` — copy audit.

## Acceptance check
After edits: manually walk `/my-purchases`, `/my-programs`, `/gagner`, `/dashboard/explore`, `/dashboard/messages`, `/admin` — all render the same professional Sidebar + TopBar. Workspace selector preserved across all. Run `tsgo`.
