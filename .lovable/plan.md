# /landing as a two-sided marketplace entry

## Summary

Transform `/landing` from a single-author "write your book" demo into a two-sided marketplace entry that speaks to **two people**:

1. **Creators who already have content** — books, ebooks, PDFs, courses, audio — and want to sell it directly.
2. **Ambassadors who have no content** — but want to earn money by promoting other people's products.

The page will be simpler, more direct, and more professional. It will keep the AI writing feature as a creator tool but no longer lead with it as the only value proposition.

## Why this direction

The previous "write your book" hero only captures one audience: aspiring authors who need to start from zero. But a large part of your traffic already has a sermon, a course, a PDF, or a guide ready to sell. Ignoring them leaves revenue on the table.

At the same time, the ambassador program is a real product path. People who don't create content can still distribute it and earn commission. A marketplace landing page that clearly presents both sides is more honest and doubles the addressable audience.

This is also a better strategic fit for the brand: SiteViral is a platform where content is created **and** distributed, not just a writing assistant.

## Key design decisions

- **One page, two doors.** The hero will show two equally clear paths, not a single search bar. Each path has its own headline, benefit line, and CTA.
- **Creator path** stays the product-led demo: write or upload your book, preview it, publish it, get paid.
- **Ambassador path** is the new front-door to the existing `/gagner` flow: browse products, share a link, earn commission.
- **AI writing feature** is kept as a feature section for creators, but it is no longer the only CTA.
- **Light mode remains the default.**
- **No "Be the next…" identity rotation.** The copy will be plain and direct, not prescriptive about who the user should become.

## Proposed page structure

1. **LandingNav** — keep, ensure theme toggle is present.
2. **New Hero: `MarketplaceHero`** — two-card/split layout:
   - Left: *"I have content to sell"* → "Publish your book, course, or guide. Get paid by Mobile Money."
     - CTA: "Create my store" → `/auth?mode=signup&intent=creator` or `/create-org`
   - Right: *"I want to earn without creating content"* → "Share products and earn 5–50% commission on each sale."
     - CTA: "Start earning" → `/gagner` (or `/auth?intent=ambassador&redirect=/gagner` for guests)
3. **Trust bar** — keep existing stats/proof, maybe add "creators + ambassadors" wording.
4. **How it works** — three simple steps that work for both sides: upload or pick, share, get paid.
5. **AI writing feature section** — show the existing `AuthorHero` / guest preview as a creator tool, but lower on the page. Headline: *"Don't have a book yet? We can help you write it."*
6. **Ambassador preview** — reuse `LandingAmbassadorSection` with the earnings simulator and featured products.
7. **Fee transparency** — keep `FeeTransparency`, make sure 10% all-inclusive is clear for creators and commission range is clear for ambassadors.
8. **Final CTA** — repeat the two-door choice.
9. **LandingFooterCompact** — add links to both paths.

## Technical changes

### Files to edit

- `src/pages/LandingPage.tsx` — reorder sections, remove `AuthorHero` from top, add new hero.
- `src/components/landing/AuthorHero.tsx` — keep but adjust copy so it can be used as a lower "write your book" feature section, not the main hero.
- `src/components/landing/MarketplaceHero.tsx` — **new** dual-path hero component.
- `src/components/landing/LandingAmbassadorSection.tsx` — reuse as-is, maybe adjust CTA to match `/gagner` intent.
- `src/components/landing/FeeTransparency.tsx` — keep, maybe add a one-line note about ambassador commissions.
- `src/components/landing/LandingFooterCompact.tsx` — add "Earn" / "Become an ambassador" link.
- `src/components/landing/LandingNav.tsx` — ensure the nav links to both `/gagner` and `/landing` clearly.
- `src/components/landing/LandingFirstWin.tsx` — consider updating copy to reflect both creator and ambassador paths (currently French-only, hardcoded).

### Routing / auth handoff

- Creator CTA for guests: `/auth?mode=signup&intent=creator` → after auth, redirect to `/create-org` or `/dashboard` onboarding.
- Ambassador CTA for guests: `/auth?mode=signup&intent=ambassador&redirect=/gagner` → after auth, redirect to `/gagner`.
- Both flows already exist in `AuthContext` / `AuthRedirectPage` or can be handled with the existing `redirect` query param.

### Copy direction

- Hero headline (FR): *"Vends ce que tu sais. Ou fais vendre ceux qui savent."*
- Hero headline (EN): *"Sell what you know. Or help others sell what they know."*
- Creator card: *"J'ai déjà un contenu à vendre"* / *"I already have content to sell"*
- Ambassador card: *"Je veux gagner sans créer de contenu"* / *"I want to earn without creating content"*

## What we are NOT changing

- No new database tables or edge functions.
- No changes to the ambassador program logic; it already works via `affiliate_links` and `/gagner`.
- No changes to the AI writing pipeline (`guest-book-outline`, `WriteWizard`, etc.).
- No changes to dashboards, auth, payments, or workspace logic.

## Success criteria

- A new visitor on `/landing` can answer in 2 seconds: *"Is this for me if I have content, or for me if I just want to earn?"*
- Both CTAs are above the fold on desktop and stacked on mobile.
- The page still feels premium and professional, not like a generic template.
- The AI writing feature is still discoverable but no longer the only message.
