# Correction pass — mobile, Digital Products, /dashboard, Analytics

Four connected fixes. Preserves all data (users, workspaces, products, courses, enrollments, purchases, messages, commissions, revenue, church data, events data).

## 1. Native mobile drawer + bottom nav

**Files:** `src/components/layout/GlobalBottomNav.tsx`, new `src/components/layout/MobileMenuDrawer.tsx`, `src/components/layout/Sidebar.tsx`, `src/index.css`.

- Keep 5-item bottom nav (Overview, Explore, Purchases, Messages, Menu).
- "Menu" opens a new `MobileMenuDrawer` — NOT the desktop `Sidebar` stuffed in a Sheet. Purpose-built native list:
  - Full `100dvh` height, safe-area top/bottom padding via `env(safe-area-inset-*)`.
  - Compact header: workspace selector (compact chip, tap-target ≥44px) + close button.
  - Groups: ACCOUNT / WORKSPACE (small caps label).
  - Rows: 48px min-height, icon (rounded tinted square), label only — no description, no border card per row.
  - Body scrolls independently; header sticky.
  - Native transitions from existing `Sheet`; press feedback `active:scale-[0.98]`.
- `Sidebar.tsx` gains a `variant?: 'mobile' | 'desktop'` OR we ship a separate component for mobile to avoid regressing desktop. Chosen: separate component.
- Verify at 320/360/375/390/412/430 px with Playwright.

## 2. Digital Products workspace overview & sidebar

**Files:** `src/lib/navigation/featureNavBuilder.ts`, `src/components/siteviral/AdaptiveDashboard.tsx`.

Sidebar for `siteviral_type === 'digital_products'` shows exactly:
Overview, Sell (`/admin/products`), Write a book (`/ecrire`), Create a course (`/creer-formation` → routes to `/create-org` when no org, else new admin creation entry — keeping existing route), Product comments (only if `product_comments` enabled), Revenue, Settings.

- Add `ai_formation_creation` handling in `specFor` → "Create a course / Créer une formation" tone violet, route `/creer-formation`.
- Add `product_comments` handling → "Product comments" route `/admin/comments` if that page exists, else keep hidden.
- For `digital_products` type: `navKeysForType.digital_products = ['digital_products','ai_book_creation','ai_formation_creation','product_comments']`. Explicitly excludes `donation_gifts` and `events` unless the org has them enabled AND is not `digital_products` type (church keeps them).
- `AdaptiveDashboard`: for digital_products type, filter `firstActions` and `activeKeys` to the same allow-list; hide events/donations cards unless explicitly enabled AND appropriate for the type. Remove any "Earn" quick action from the workspace overview (it isn't there today but audit and enforce).

## 3. `/dashboard` smart resolver

**Files:** `src/pages/DashboardRouter.tsx`, `src/components/layout/TopBar.tsx` (avatar Dashboard link → `/dashboard`).

New resolver logic in `DashboardRouter`:
1. Pending action (existing `pendingAction` util): resume it.
2. `currentOrg` set AND user canManage → `Navigate to /admin`.
3. Else if `userOrgs.length === 1` with manage rights AND nothing saved → auto-select, `Navigate to /admin`.
4. Else if manageable orgs > 1 AND no saved → render inline `WorkspaceChooser` (list of manageable orgs, "Choose a workspace to manage" copy, "Create workspace" link).
5. Else (zero manageable orgs) → render `PersonalHome` inside the unified shell (no rename of the file needed; UX is neutral).

## 4. Analytics gating

**Files:** `src/pages/CreatorAdvancedAnalyticsPage.tsx`, `src/components/layout/TopBar.tsx`, wherever the avatar exposes Analytics.

- If `currentOrg` null AND exactly one manageable org exists → auto-select + reload page.
- If `currentOrg` null AND multiple → show workspace chooser inline (reusing chooser from #3).
- If zero manageable orgs → hide Analytics entry from menus; page shows a soft "Analytics requires a workspace" with CTA to `/create-org`.
- TopBar avatar: only render Analytics link when `managedOrgs.length > 0`.

## 5. Copy cleanup

- OrgSwitcher: when no org selected but orgs exist, label is `Choisir un espace` / `Choose workspace` (no truncation).
- Remove any remaining `personal space` / `espace personnel` strings.

## Out of scope (preserve current behavior)

- No DB migrations.
- No changes to PersonalHome content (still renders inside unified shell for zero-workspace case).
- Events/donations code, church code, payments, KYC, RLS untouched.
- Desktop sidebar visual language unchanged.

## Verification

- `tsgo --noEmit`.
- Playwright: sign in as test user, visit `/dashboard`, `/admin`, `/my-purchases`, open mobile drawer at 360/390/430.
- Visual screenshot check of Digital Products workspace overview.

## Files changed (estimate)

1. `src/components/layout/GlobalBottomNav.tsx`
2. `src/components/layout/MobileMenuDrawer.tsx` (new)
3. `src/lib/navigation/featureNavBuilder.ts`
4. `src/components/siteviral/AdaptiveDashboard.tsx`
5. `src/pages/DashboardRouter.tsx`
6. `src/components/layout/TopBar.tsx`
7. `src/pages/CreatorAdvancedAnalyticsPage.tsx`
8. `src/components/org/OrgSwitcher.tsx` (copy only)
9. `src/index.css` (safe-area utility if missing)
