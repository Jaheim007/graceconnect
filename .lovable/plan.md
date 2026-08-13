# /landing — three audiences, one page, clear hierarchy

## The strategic call

Yes, address all three audiences on `/landing`. But **not with equal weight**. Three co-equal choices is the single most common way a landing page loses conversions — visitors given three equivalent doors pick none. The fix is hierarchy, not fewer doors.

Ranking, based on acquisition cost and what the business needs right now:

1. **Primary — the person with no book yet.** Cheapest to acquire: no account, no assets, instant free demo. This is the emotional hook and stays the hero exactly as it is today.
2. **Strong secondary — the person who already has content elsewhere.** Highest value: they can transact within days. They don't convert on a demo, they convert on fees, payout method, and migration effort.
3. **Tertiary but visible — the person who wants to earn without creating.** Easiest to acquire in volume, but brings no supply. An early marketplace dies from missing supply, not missing promoters. Promoting an empty catalog also looks bad. So: present it clearly, don't lead with it.

Nothing is removed. The book writer keeps the hero. The other two get their own real, well-designed sections instead of being buried in one small text link.

## What changes

### 1. Hero stays as-is (audience 1)
`AuthorHero` keeps its position, headline, free guest generation, and preview. No copy rewrite, no demotion.

One change only: the existing small "J'ai déjà mon contenu" text link becomes a proper, visible secondary action — still below the primary field, but with enough weight that a content owner sees it immediately instead of scanning past it.

### 2. New section: "You already have content" (audience 2)
A dedicated section directly under the hero — the first thing after the fold, so a content owner reaches it fast.

This audience needs different arguments than the book writer. Not "we'll help you write" but:

- **Bring what you already have.** PDF, ebook, course, audio, sermon recordings.
- **Keep more of each sale.** 10% all-inclusive vs 30–65% on Western platforms. Concrete side-by-side.
- **Get paid the way you actually get paid.** Wave, Orange Money, MTN — not a card-only payout that never arrives.
- **Migrating is fast.** Upload, price, share a link. Emphasis on low switching effort, since this person already has a platform.

CTA: "Publish what I already have" → `/create-org` (signed in) or `/auth?mode=signup&intent=creator` (guest).

### 3. Ambassador section keeps its place lower on the page (audience 3)
Reuse the existing `LandingAmbassadorSection` — it already has the earnings simulator, the 5–50% commission range, and the three-step explanation. Placed after the creator arguments and fee transparency, so it lands once the visitor understands there's real content to promote.

Copy stays honest: earn by sharing other people's products, no content of your own required.

CTA: "Start earning" → `/gagner`, or `/auth?mode=signup&intent=ambassador&redirect=/gagner` for guests.

### 4. Final CTA becomes a three-door recap
`CoreFinalCTA` restructured to name all three paths once, plainly, at the bottom — for the visitor who scrolled everything and now wants to pick. This is the one place where the three appear side by side, and it's safe there because the visitor is already informed.

## Page order

```text
LandingNav
AnnouncementStrip
AuthorHero              <- audience 1, unchanged, primary
[NEW] AlreadyHaveContent <- audience 2, strong secondary
ProductShot
LandingTrustShield
FeeTransparency          <- serves audiences 1 and 2
LandingAmbassadorSection <- audience 3
CoreFinalCTA             <- three-door recap
LandingFooterCompact
```

## Technical notes

**New file**
- `src/components/landing/AlreadyHaveContent.tsx` — audience 2 section. Bilingual via `useI18n`, semantic design tokens only, `Reveal`/framer-motion for entry animation consistent with the rest of the page.

**Edited files**
- `src/pages/LandingPage.tsx` — mount the new section, add `LandingAmbassadorSection` (lazy), reorder as above.
- `src/components/landing/AuthorHero.tsx` — upgrade the "I already have my content" link to a visible secondary action anchoring to the new section. Hero copy untouched.
- `src/components/landing/CoreFinalCTA.tsx` — restructure into the three-door recap.
- `src/components/landing/LandingFooterCompact.tsx` — ensure all three intents are linked.
- `src/pages/LandingPage.tsx` SEO — broaden title/description so it reflects selling existing content and earning by promoting, not only AI book writing.

**Auth handoff** — uses existing `intent` and `redirect` query params plus `setPendingAction`; no new routing logic.

**Not touched** — no database changes, no edge functions, no changes to the AI writing pipeline, ambassador/affiliate logic, dashboards, auth, payments, or workspace logic.

## How we'll know it worked

- A content owner landing on the page hits their argument within one scroll, not five.
- The free book demo still converts as the primary hook — it isn't diluted by competing CTAs at the same visual weight.
- The ambassador path is reachable without being the first thing a visitor sees.
- On mobile, each section reads as one clear message per screen, never three competing buttons above the fold.
