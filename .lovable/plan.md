# Beauty Pro — Dashboard rebuild + KYC visibility fix

## 1. Public profile: KYC gating clarified

**Problem**: Clicking "Voir profil public" from dashboard shows "Profil introuvable" because RLS filters `status = 'active'` and public page filters the same. Provider can't preview their own page, and the UX doesn't explain that KYC = required to appear in Explore.

**Fix**:
- Public profile page (`BeautyProviderProfile.tsx`): try `.eq('status','active')` first, then fallback to the current logged-in user's own row (RLS already allows owner to read own pending row). Show a top banner "Aperçu privé — visible dans l'Explore après validation KYC" when the viewer is the owner and status ≠ active.
- Dashboard: keep the existing yellow KYC banner but make the message explicit: *"Tu es invisible dans l'Explore SiteViral Beauty tant que ton KYC n'est pas validé. Ton lien public reste partageable manuellement."* + "Compléter le KYC" CTA.
- Search page (`BeautySearch.tsx`): already only shows `status='active'` — no change.

## 2. Dashboard shell rebuilt (Aurora-style, mobile-first)

Reference: https://aurora.themewagon.com/dashboard/ecommerce — clean sidebar, top search bar, grouped nav, colored icon tiles, section cards.

**Layout** — replace current shell with a proper shadcn `Sidebar` (using `SidebarProvider`, `collapsible="icon"`), matching the Digital dashboard structure but with the Beauty pink accent (`--primary` already set in beauty scope):
- Left sidebar (desktop, mini-collapse on tablet, offcanvas Sheet on mobile) with SiteViral S-logo + "Beauty Pro" tag, provider avatar+name+KYC pill, then grouped nav.
- Top bar: mobile hamburger + page title + search + notifications + avatar menu.
- Content: rounded-2xl section cards with soft borders and gradient stat tiles (rose/amber/emerald/violet), consistent with Aurora density.
- All spacing / typography follows existing Digital dashboard tokens — no hardcoded colors.

**Nav sections** (unchanged keys, add missing surfaces):
- Pilotage: Overview, Rendez-vous, Statistiques
- Catalogue: Services, **Portfolio (photos + vidéos)**, Disponibilités
- Communication: Messages, Avis
- Compte: **Profil (éditable)**, Paramètres, Paiements & KYC

## 3. Profile & media editing

- **Profil éditable** (new fully-working editor inside Settings/Profil tab):
  - business_name, bio, city, address, phone, at_salon_ok, home_service_ok, specialties (multi-select from BEAUTY_CATEGORIES), avatar upload, cover upload
  - Uses existing `beauty-media` storage bucket
- **Portfolio tab**: photo upload (drag/drop), video upload OR paste YouTube/TikTok/Instagram embed URL, reorder, delete. Writes to `beauty_provider_media` (kind: `photo` | `video`, `url`, `embed_url`, `caption`, `position`).

## 4. Navigation fix

Audit every link labeled "Mon espace" / "Mon espace pro" — ensure they all route to `/beauty/pro` (new dashboard) and not to a stale `/dashboard` or `/creator` route. Files to check: `BeautyHeader.tsx`, `BeautyActionHub.tsx`, `BeautyLandingBody.tsx`, `GlobalBottomNav`.

## 5. Mobile-first polish

- Sidebar collapses to bottom-anchored trigger on `<md` via Sheet.
- Stat cards stack single-column, tables become card lists.
- All touch targets ≥40px per project standard.
- Header centered logo, safe-area-insets respected.

## Technical notes

- No schema changes required (specialties/address/lat/lng already exist from prior migration; media table exists).
- Public profile RLS already permits `user_id = auth.uid()` — only the query needs updating.
- Reuse `PremiumCard`, `DashboardSection`, shadcn `Sidebar`, existing `useIsMobile` hook, `beauty-scope` CSS class.
- Bilingual FR/EN via `useI18n`.

## Files touched
- `src/pages/beauty/BeautyProDashboard.tsx` — major rebuild
- `src/pages/beauty/BeautyProviderProfile.tsx` — owner preview + banner
- `src/components/beauty/BeautyHeader.tsx` — verify My space link
- `src/pages/beauty/BeautyActionHub.tsx` — verify routes
- Possibly new: `src/components/beauty/pro/*` subcomponents to keep file readable
