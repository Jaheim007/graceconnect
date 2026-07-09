## Goal

Every page a pro reaches from their dashboard must stay **inside** the fixated Pro Shell (sidebar visible on desktop, bottom nav on mobile). No more full-page hijacks. Plus a mobile top bar that feels as clean and confident as Djamo / Wave.

---

## 1. Reconnect disconnected pages to the Pro Shell

**Problem:** Links like "Messages", "Bookings", "Sales" still route to legacy pages (`/home/messages`, `/home/bookings`, `/dashboard/sales`, etc.) that render outside `ProShell`, so the sidebar and brand disappear.

**Fix:**
- Rewrite every dashboard/bottom-nav CTA for a provider to point at the `pro/*` route of their vertical:
  - `/home/messages` → `/home/pro/messages` (same for beauty/events/learn)
  - `/home/bookings` → `/home/pro/orders`
  - `/dashboard/sales`, `/dashboard/revenue`, `/home/pro/revenue` → `/home/pro/revenue`
  - Settings / KYC / services links → their `/{vertical}/pro/settings/*` equivalents
- Add redirect routes in `App.tsx` so any old bookmark or lingering link (`/{vertical}/messages`, `/{vertical}/messages/:id`, `/{vertical}/bookings`) sends **providers** into `pro/*` (clients still land on the public list).
- Sweep components: `HomeProDashboard`, `BeautyProDashboard`, `EventsProDashboard`, `EducationTutorDashboard`, `featureNavBuilder`, `BeautyHeader`, and any card that hard-codes a legacy path.

## 2. Orders ≠ Revenue

**Problem:** The mobile bottom-nav "Orders" tab opens the old "My sales & donations" (a revenue view).

**Fix:**
- Bottom-nav "Orders" for a provider → `/{vertical}/pro/orders` (incoming bookings/requests only).
- Keep "Revenue" tab pointing to `/{vertical}/pro/revenue` (sales, payouts, KYC).
- Rename the legacy `SalesPage` label to "Revenue" so the term "Orders" is never reused for money.
- Client-side (buyer) "Orders" tab stays as `MyPurchases`.

## 3. Mobile top nav — Djamo / Wave polish

Redesign `TopBar.tsx` for mobile (`< lg`):
- Large round avatar on the left (tap → account sheet), business name + role chip beside it.
- Center: nothing (removes clutter — Djamo style).
- Right: single "action" pill grouping search + notifications with a subtle unread dot; theme + language collapse into the account sheet.
- Sticky, translucent blur (`backdrop-blur-xl`), 56 px tall, 1 px hairline border, safe-area padding.
- Credits chip becomes a compact glyph-only badge (like Wave's balance chip); tapping opens the credits sheet.
- Workspace switcher collapses into the avatar sheet when the user has only one org (already the rule) and is hidden entirely on mobile top bar.
- Bottom-nav untouched except for the label/route fixes above.

Desktop top bar is unchanged.

## 4. Verification

- Manual routes: `/home/pro`, `/home/pro/messages`, `/home/pro/orders`, `/home/pro/revenue`, `/beauty/pro/*`, `/events/pro/*`, `/learn/pro/*` — sidebar must remain visible at ≥ lg.
- Legacy `/home/messages` while signed in as a provider → redirects to `/home/pro/messages`.
- Mobile viewport (`375×812`): top bar matches new spec; Orders tab opens bookings list, Revenue tab opens revenue.

## Files touched (approx.)

- `src/App.tsx` — legacy redirect routes for providers.
- `src/components/layout/TopBar.tsx` — mobile redesign.
- `src/components/layout/BottomNav.tsx` (or equivalent per-vertical nav) — route + label fixes.
- `src/lib/navigation/featureNavBuilder.ts`, `actionNavItems.ts` — path rewrites.
- `src/pages/home/HomeProDashboard.tsx`, `src/pages/beauty/BeautyProDashboard.tsx`, `src/pages/events/EventsProDashboard.tsx`, `src/pages/education/EducationTutorDashboard.tsx` — link rewrites (or replace with a small redirect to the new shell overview if fully superseded).
- `src/components/beauty/BeautyHeader.tsx` — link rewrites.

No schema changes.
