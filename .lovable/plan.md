# Propose-a-service flow — end-to-end build

Goal: whoever taps "Je propose" (from landing category or the "Trouver un service" popup) reaches a working dashboard tailored to their activity, without ever seeing "organization", "slug", or "type". One functionality per screen, mobile-first, Siteviral-branded.

## The 5-screen flow (single funnel, no dead-ends)

```text
Landing / Category
      │
      ▼
[1] /start?activity=<vertical>            ← pre-selects the activity from category
      │  (user can add/change; one screen)
      ▼
[2] /start/details                        ← name + city (+ church denomination if church)
      │
      ▼
[3] /auth?mode=signup&return=/start/finish (only if not logged in)
      │
      ▼
[4] /start/finish                         ← "Creating your space…" auto-provisions, no form
      │  (creates org, sets siteviral_type, enables modules, seeds sample content)
      ▼
[5] /dashboard                            ← vertical hub matching the activity
```

Key rules

- `/create-org` is no longer shown to users coming from `/start` — it's fully replaced by `/start/details` + `/start/finish` for this flow. Direct visitors of `/create-org` keep the legacy wizard for now.
- Session key `sv_start_config` carries `{ activity, name, city, denomination?, currency, modules[] }` across auth.
- Currency is auto-detected (existing `detectCurrencyFromTimezone`) — never asked.
- Slug is auto-generated silently from the name — never shown as "URL/slug".

## Screen contents

**[1] /start (Choose activity)** — already exists. Small change: if `?activity=<key>` present (from a category tile → "Je propose"), pre-select that goal and show a friendly header: "Vous proposez : Beauté. Ajoutez d'autres activités si besoin."

**[2] /start/details** — new page. Single-column, mobile-first. Fields:

- Nom de votre activité (large input) — used for the workspace + public page name.
- Ville / zone d'intervention (input with country auto-detected suggestion).
- If activity includes `offer_church` → also ask "Dénomination" (existing `churchDenominations.ts`).
- CTA "Continuer".

**[3] /auth** — reuse. On success returns to `/start/finish`. Header copy tightened: "Créez votre compte pour publier votre {activité}."

**[4] /start/finish** — new page. No form, just a full-screen "loading + checklist" animation showing what we set up:

- ✓ Espace créé
- ✓ Paiement & KYC préparés
- ✓ [modules ...] activés (from `MARKET_CATS[activity].modules`)
- Then auto-redirect to `/dashboard`.

Logic: reads `sv_start_config`, calls `create_organization_with_owner` RPC, then `confirmSiteviralType` with `enabled_features` derived from the picked vertical's `modules` (mapped to `SiteviralFeatureKey`s via a small `moduleToFeatures` map). Persists partner code if present. Clears session config.

**[5] Vertical dashboard** — already exists per vertical. Router (`DashboardRouter`) already picks the right hub from `siteviral_type`. We just confirm each of the 9 verticals routes correctly:

- digital → DigitalProductDashboard
- artisans_home_services → HomeProDashboard
- beauty → BeautyLanding pro area
- church → ChurchProDashboard
- influencers → new lightweight `InfluencerProDashboard` (stub with "coming soon" cards for non-shipped modules, plus profile + payments + KYC tiles that work today)
- sport → new lightweight `SportProDashboard` (same pattern)
- tutors_home_teachers → EducationTutorDashboard
- instrumentists → new lightweight `MusicProDashboard`
- services → generic `GeneralProDashboard` (profile, services list, bookings if enabled)

For the 4 new lightweight hubs: same layout, tiles gated by `modules` from `marketplaceCats.ts` via `useEnabledModules`. Each tile that isn't shipped yet shows "Bientôt disponible" — no broken links.

## Files

Create

- `src/pages/start/StartDetailsPage.tsx` — screen [2]
- `src/pages/start/StartFinishPage.tsx` — screen [4], auto-provision + checklist UI
- `src/lib/siteviral/moduleToFeatures.ts` — map `MarketModule[]` → `SiteviralFeatureKey[]` + `SiteviralType`
- `src/pages/dashboard/InfluencerProDashboard.tsx`
- `src/pages/dashboard/SportProDashboard.tsx`
- `src/pages/dashboard/MusicProDashboard.tsx`
- `src/pages/dashboard/GeneralProDashboard.tsx`
- `src/components/start/StartShell.tsx` — shared branded shell (Siteviral logo top-left, progress bar 1/2/3, back button, mobile-first max-w-md)

Edit

- `src/pages/StartOfferingPage.tsx` — pre-select from `?activity=`, use `StartShell`, on Continue navigate to `/start/details` (not `/create-org`).
- `src/App.tsx` — add routes `/start/details`, `/start/finish`; wire new dashboards into `DashboardRouter`.
- `src/pages/DashboardRouter.tsx` — add the 4 new type→hub mappings.
- `src/components/landing/CategoryPickerDialog.tsx` — "Je propose" navigates to `/start?activity=<key>` (already close, verify).
- `src/components/landing/MarketplaceCategories.tsx` — same verification for the inline picker.
- `src/lib/siteviral/inferFromGoals.ts` — keep as fallback, but the new flow uses `moduleToFeatures` (activity-driven, deterministic).

Delete / retire (not in this PR unless small)

- Nothing deleted; `/create-org` stays as legacy entry point for now.

## Branding & polish (applies to every new screen)

- Header: Siteviral wordmark + logo mark, top-left; language switcher top-right.
- One H1 per screen, ≤ 6 words, in the user's language.
- Copy: "Créer" not "Provisionner", "Votre espace" not "Organization", "Activité" not "Type".
- Buttons: primary full-width on mobile, `h-12`, single clear action. Secondary "Retour" as ghost link.
- Progress: 3 dots (Activité · Détails · Prêt).
- Empty/loading states are branded (spinner uses `primary`, no default shadcn skeleton grey).
- All new pages have `<SEOHead noindex>` — they're funnel pages.

## Technical notes (skippable)

- `moduleToFeatures` mapping:
  - booking → `appointment ===> For Church, Sport/Coach, Artisan, Beauty, Musicians, Influncers, Other Services. This should be a functionality intergrated in them` 
  - digitalSales → `digital_products === > Church, Digital, Tutors,Other Services`  
  - orderGen → `order_generator == > Church` 
  - donations → `donation_gifts`
  - payments → `payment`
  - aiBooks → `ai_book_creation`
  - aiFormation → `ai_formation_creation` (reuse existing)
  - comments → `product_comments`
  - location → `location`
  - events → `events`
  - reviews → `reviews`
  - kyc → `kyc`
  - affiliate → `affiliation`
- `activityToSiteviralType`: digital→`digital_products`, artisans→`artisans_home_services`, beauty→`beauty`, church→`church`, influencers→`influencers`, sport→`sport`, tutors→`tutors_home_teachers`, music→`instrumentists`, general→`services`.
- `/start/finish` is idempotent: if user refreshes and an org was already created this session, it skips creation and just redirects.  
  


  | Functionality                     | Church | Digital Products | Sport / Coach | Home Services / Artisans | Beauty | Tutors / Teachers | Musicians / Instrumentists | Influencers | General Services |
  | --------------------------------- | ------ | ---------------- | ------------- | ------------------------ | ------ | ----------------- | -------------------------- | ----------- | ---------------- |
  | Appointment / Booking             | ✅      | —                | ✅             | ✅                        | ✅      | ◐                 | ✅                          | ✅           | ✅                |
  | Digital Product Sales             | ✅      | ✅                | —             | —                        | —      | ✅                 | —                          | ◐           | ✅                |
  | Order Generator                   | ✅      | ✅                | ✅             | ✅                        | ✅      | ✅                 | ✅                          | ✅           | ✅                |
  | Offering / Donation / Gifts       | ✅      | ✅                | —             | —                        | —      | —                 | —                          | ✅           | —                |
  | Payment Integration               | ✅      | ✅                | ✅             | ✅                        | ✅      | ◐                 | ✅                          | ◐           | ✅                |
  | AI Book Creation                  | ✅      | ✅                | —             | —                        | ✅      | ◐                 | —                          | ◐           | ◐                |
  | AI fnformation / Content Creation | ✅      | ✅                | ◐             | ◐                        | ✅      | ✅                 | ◐                          | ✅           | ✅                |
  | Comments on Digital Products      | ✅      | ✅                | —             | —                        | —      | ✅                 | —                          | ◐           | ✅                |
  | Location / Map / Area             | ✅      | —                | ✅             | ✅                        | ✅      | ✅                 | ✅                          | —           | ◐                |
  | Events + Tickets                  | ◐      | ✅                | ✅             | —                        | —      | ◐                 | ✅                          | ◐           | ◐                |
  | Reviews on Person / Establishment | —      | —                | ✅             | ✅                        | ✅      | ✅                 | ✅                          | ✅           | ✅                |
  | KYC                               | ✅      | ✅                | ✅             | ✅                        | ✅      | ✅                 | ✅                          | ✅           | ✅                |
  | Affiliation                       | ✅      | ✅                | ✅             | ✅                        | ✅      | ✅                 | ✅                          | ✅           | ✅                |


Things like KYC, Affiliation, ReViews , Locarion, Payment Intergration are functionalities that should be intergrated directly when their dashboard is created base on the type of Service that they are proposing   
  
Out of scope for this PR

- Building the full feature UIs for Influencers / Sport / Music beyond the hub skeleton.
- Reworking `/create-org` legacy wizard.
- Payments provider selection (kept as-is).  
