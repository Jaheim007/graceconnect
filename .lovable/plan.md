
# Pro Dashboard v2 — service-focused, fixated shell

Scope: applies to every service pro (Artisan/Home, Beauty, Tutor/Education, Events). Digital creators keep today's behaviour.

## 1. Fixated dashboard shell (desktop ≥ lg)

New `ProShell` layout used by `/home/pro`, `/beauty/pro`, `/education/pro`, `/events/pro`:

```text
┌─────────────────────────────────────────────┐
│ Sidebar (sticky)  │  Right pane (routed)    │
│  • Overview       │                         │
│  • Messages       │  <Outlet />             │
│  • Orders         │   → opens here, NOT     │
│  • Revenue        │     as a new full page  │
│  • Public page    │                         │
│  • Settings       │                         │
└─────────────────────────────────────────────┘
```

- Sidebar stays fixed. Clicking an item navigates to a nested child route (`/home/pro/messages`, `/home/pro/orders`, …) that renders inside the right pane via `<Outlet />`.
- Mobile: unchanged — keeps native full-page flows + bottom nav.
- No more jumping to `/home/bookings`, `/home/messages` from the pro dashboard. Those routes still exist for the client-side flows, but the pro's sidebar uses `/home/pro/*` variants that mount the same panes inside the shell.

## 2. Professional Messages UI

Rebuild `ProMessages` (used by all verticals) as a 2-column pane inside the shell:

- Left: conversation list (search, pinned, unread badges, avatars, last message preview, relative time).
- Right: active thread — sticky header (client name, avatar, "typing…"), message stream with day dividers, own messages in `primary` bubble with `primary-foreground`, incoming on plain surface, timestamps under each cluster, then a `PromptInput` composer.
- Composer toolbar:
  - `+` menu → **Send quote** (inline card) or **Open full order panel**.
  - Attach image, emoji.
- Inline quote card = compact message part `{ type: 'quote', service, price, deposit, currency }` rendered as a rich card in the stream with Accept / Decline buttons for the client.
- Full order panel = slide-in right drawer inside the shell with multi-line-item form (services, dates, deposit %, notes, delivery address) → on submit inserts an `order` row + posts a rich `order` message into the thread.

Backend touch is minimal: reuse existing `*_conversations` / `*_messages` tables per vertical, add a `message_type` (`text` | `quote` | `order`) and a `payload jsonb` for the card data. Storage is per-vertical (home_messages, beauty_messages, …) so RLS stays scoped.

## 3. Orders vs Revenue (rename + split)

- **Orders** = incoming client requests/bookings the pro must action. Lists rows from `*_bookings` + inline `quote/order` messages awaiting response. Statuses: New → Accepted → In progress → Completed → Cancelled. This replaces what was mis-labelled "Orders" (sales dashboard).
- **Revenue** = money earned. Cards: 30d revenue, total revenue, pending payout, next payout ETA + KYC/payout status + recent completed bookings. Reuses `home_provider_stats` / equivalents.
- Sidebar order: Overview · Messages · Orders · Revenue · Public page · Settings.

## 4. KYC + onboarding alerts

`ProDashboardAlerts` component shown at top of Overview and Orders panes when relevant:

- KYC not started/pending → amber banner "Verify your identity to receive bookings & payouts" → `/…/pro/kyc`.
- No services defined → blue banner "Add your first service" → services pane.
- Payout method missing → banner in Revenue pane.
- Public page not shared yet → subtle nudge in Overview.

## 5. Service-aware Settings

Settings pane (in-shell) with sections gated by the pro's vertical:

- Public page (share link, QR, preview, cover, bio, WhatsApp) — always on.
- Services & pricing — always on.
- Availability / zone — Home, Beauty, Events, Education.
- KYC & payouts — always on.
- Notifications — always on.
- Advanced modules (optional toggles: AI courses, digital products, affiliation…) — same registry we cleaned up last turn.

No "Organization profile" jargon for service pros — labels become "My business profile".

## 6. Account menu / workspace switcher (UX-driven answer)

Rule: the menu adapts to what the user actually has.

- If the user manages exactly one org and it's a service vertical → **hide** "Switch workspace/page" and "Create a workspace/page". Show: Profile, Subscription & billing, Sign out.
- If they own ≥ 2 orgs → show "Switch workspace" (compact org picker), keep "Create" behind a "More" submenu.
- Superadmins always keep both.
- Item labels for service pros become "My business" instead of "workspace/page".

## 7. Files (high-level)

New:
- `src/components/pro/ProShell.tsx` — sticky sidebar + right pane layout, desktop-only split; mobile falls back to current pages.
- `src/components/pro/ProSidebar.tsx` — service-aware nav, uses shadcn `Sidebar`.
- `src/components/pro/ProDashboardAlerts.tsx` — KYC / services / payout / share nudges.
- `src/components/pro/messages/ConversationList.tsx`
- `src/components/pro/messages/ConversationThread.tsx`
- `src/components/pro/messages/QuoteCard.tsx` (inline message part)
- `src/components/pro/messages/OrderDrawer.tsx` (full order side panel)
- `src/components/pro/orders/OrdersPane.tsx`
- `src/components/pro/revenue/RevenuePane.tsx`
- `src/components/pro/settings/ProSettingsPane.tsx`
- `src/components/layout/AccountMenu.tsx` — smart switcher logic.

Refactor:
- Route trees for `/home/pro`, `/beauty/pro`, `/education/pro`, `/events/pro` become nested routes rendering inside `ProShell`.
- `HomeProDashboard`, `BeautyProDashboard`, `EducationTutorDashboard`, `EventsProDashboard` become the Overview child route.
- Existing full-page routes (`/home/messages`, `/home/bookings`, `/home/pro/revenue`, …) keep working for direct links & mobile, but the pro sidebar targets the nested `/…/pro/*` variants.

Backend:
- Migration: add `message_type text default 'text'` and `payload jsonb` to `home_messages`, `beauty_messages`, `education_messages`, `events_messages` (only where missing). No RLS change needed — inherits from existing policies. GRANTs preserved.

## 8. Rollout order

1. Shell + smart account menu + KYC alerts (immediate UX win, low risk).
2. Orders/Revenue rename + panes.
3. Messages redesign + inline quote card.
4. Full order drawer (depends on 3).
5. Service-aware Settings pane.

I'll implement 1 → 2 → 3 in this turn (biggest visible wins) and follow up with 4 → 5 next.
