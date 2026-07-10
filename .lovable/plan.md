# Siteviral nav restructure + real-time messaging + order generation

Big scope — splitting into 4 tracks so we ship in the right order.

---

## Track 1 — Digital (Siteviral) sidebar: strict default items

Rewrite the "digital" branch in `src/lib/navigation/featureNavBuilder.ts` so the sidebar shows **only** the items below by default. Everything else is moved into Settings → Modules and only appears in the sidebar when toggled on.

**If the user has an organization (provider):**

1. Overview → `/dashboard`
2. My purchases → `/dashboard/purchases`
3. Sell (digital products) → `/dashboard/products`
4. Write a book in 5 min → `/ecrire`
5. Create a promotion → `/dashboard/promotions`
6. Explore → `/discover`
7. Claim (affiliate / réclamer) → `/dashboard/affiliate`
8. Revenue → `/dashboard/revenue`
9. Settings → `/dashboard/settings`
10. Sign out (footer action)

**If the user does NOT have an organization:**

1. Overview → `/dashboard`
2. My purchases → `/dashboard/purchases`
3. Explore → `/discover`
4. Claim → `/dashboard/affiliate what is this Claim interface is it to see how they gain from commissions`
5. Revenue → `/dashboard/revenue`
6. Settings → `/dashboard/settings`

Detection: reuse `useUserKind()` (`provider` vs `buyer`/`new`) — already exists at `src/hooks/useUserKind.ts`.

**Removed from default sidebar** (moved to Settings → Modules, opt‑in):
CRM, Community, Events (digital), Order generation, Announcements, Campaigns, Appointments, Affiliate marketplace tools, Coupons, Bundles, any other "extra" items currently forced in.

## Track 2 — Settings → Modules matrix for Digital

Extend `src/lib/dashboardModules.ts` and `src/pages/dashboard/ModulesSettings.tsx` so the "Modules to activate" list for the digital persona contains the removed items above, each with a `sidebarRoute` used by `featureNavBuilder` to inject the item into the sidebar when enabled. Nothing changes for the church/beauty/events/education personas — their module lists stay as they are.

## Track 3 — Real‑time messaging on public pages (provider inbox)

New generic messaging layer for providers of any vertical (digital orgs, church, beauty, home, events, education). Non‑providers do NOT get a Messages entry.

**DB (new migration):**

- `conversations(id uuid pk, org_id uuid null, provider_user_id uuid not null, client_id uuid not null, vertical text, last_message_at timestamptz, created_at timestamptz)` + unique on `(provider_user_id, client_id, vertical)`.
- `messages(id uuid pk, conversation_id uuid fk, sender_id uuid, kind text check in ('text','order'), body text, order_payload jsonb, created_at timestamptz, read_at timestamptz)`.
- GRANTs to `authenticated` + `service_role`; RLS: only participants (`provider_user_id` or `client_id`) can select/insert; realtime enabled on both tables.

**UI:**

- `POST message` on the public org page ("Message this seller / church / provider") — visible only when the target is a provider offering services. Hidden for pure digital‑product‑only orgs? → still allowed since user asked "we can message them" on public pages universally.
- Provider inbox at `/dashboard/messages` (new). List left, thread right, realtime via Supabase channels. Reuses the pattern already in `src/pages/education/pro/EducationProMessagesPane.tsx` but generic.
- Client inbox reachable from user menu when they have ≥1 conversation.

Sidebar: "Messages" is added to the provider sidebar for **all verticals** automatically (baked‑in for providers, like KYC/payments — not a toggle).

## Track 4 — Order generation via message

Inside a thread, the provider can click **"Send an order"** → modal with `{title, description, amount, currency, due_date?}` → inserts a `messages` row with `kind='order'` and a JSON payload. The message bubble renders as an order card with **Pay now** (client) / **Mark as paid** or **Cancel** (provider) actions. Payment uses the existing checkout route with a one‑off line item; on success the order row's status flips via edge function webhook.

Scope note: for this pass we ship the order **card + create flow + status transitions**. Wiring to a full checkout is done through the existing `platformCheckout` helper — no new PSP work.

## Track 5 — Route hygiene

Audit `src/App.tsx` to confirm every sidebar target above resolves to a real route and renders the right page. Fix any that currently redirect elsewhere:

- `/dashboard/purchases` → MyProgramsPage or dedicated purchases page
- `/dashboard/products` → seller products list
- `/dashboard/promotions` → promo creation hub
- `/dashboard/affiliate` → claim/affiliate page
- `/dashboard/revenue` → revenue page
- `/dashboard/settings` → settings (Modules tab inside)
- `/dashboard/messages` → new inbox
- `/ecrire` → 5‑min book editor
- `/discover` → explore
- Sign‑out action (footer of sidebar) calls `supabase.auth.signOut()` then routes to `/`.

---

## Suggested execution order (one PR per track)

1. Track 1 + Track 5 together (sidebar + route fixes) — smallest, unblocks the rest.
2. Track 2 (Modules matrix) — makes removed items reachable.
3. Track 3 (messaging + DB + realtime).
4. Track 4 (order card on top of messaging).

## Open questions before I start

1. **Purchases page**: should `/dashboard/purchases` be a brand‑new page listing every purchase (digital products + programs + tickets + donations), or reuse `MyProgramsPage`? I'd recommend a new unified page.
2. **"Claim"**: confirm this means the affiliate / réclamer page (`/dashboard/affiliate` — where users claim commissions), not something else.
3. **Messaging scope for church/beauty/etc**: today each vertical has its own `*_conversations` table. Do we (a) migrate them all to the new generic `conversations` table, or (b) keep vertical tables and just add a generic one for digital? I'd recommend **(b)** for this pass to avoid a risky migration, and unify later.
4. **Order payment**: OK to route Pay‑now through the existing platform checkout (Stripe/GeniusPay depending on region), or do you want a lighter "manual mark as paid" flow first?

Once you confirm 1‑4 I'll ship Track 1 + 5 in the next turn.