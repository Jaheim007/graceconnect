# Landing strategy: one main page for the author, one standalone page for churches

Short answer to your question: not one landing page for everybody, and not twenty. Two funnels that each speak to one person, plus a footer that finally matches what the app really does.

- `/landing` speaks to **one person: the author / teacher** who wants to turn what they know into a book or a formation and get paid by Mobile Money.
- `/churches` becomes a **standalone share page** with its own nav and its own footer. When you send that link to a pastor, they never land in the generic SiteViral menus. It's their page, their words, their one action.

Structure copied from what you liked on rork.com (one big personal headline, one clear action, product shown right under the fold), but on our own light navy/white brand surfaces instead of the dark canvas.

## 1. Main landing rebuilt for the author

New hero, "one person" style:

- Small announcement strip at the very top (dismissible), e.g. new AI creation or 10% all-inclusive fee — one line, one link.
- Headline that names the reader, not the market: "Be the next author who lives off what they teach." (FR first, EN mirrored.)
- One sentence under it: write your book or formation with AI, sell it, get paid by Wave / Orange / MTN.
- **One primary action**: a single input, "What do you want to teach?" → goes straight into the creation flow with that text prefilled. Secondary quiet link: "I already have my content".
- Under the fold: a real product shot of the app (creation → published page → sale), not abstract illustrations.
- Then, in this order: how it works in 3 steps, real proof (live counts we already have, no invented numbers), transparent fee line, one final CTA.

What gets removed from the homepage: the multi-CTA row (three competing buttons), the Create/Sell/Earn/Discover chip strip, and the church block. Earning as an affiliate stays reachable from the nav and footer, not as a competing hero promise.

## 2. Church page becomes its own funnel

- Its own header (SiteViral for Churches wordmark, one action: create your church space) and its own compact footer — no generic Discover / creator menus.
- Hero rewritten for the pastor: one promise (giving, sermons, members, events in one space), one action, reassurance on payouts and who controls the money.
- Capability grid trimmed to what actually ships today, grouped as Giving / Sermons / Members & events / Payments.
- Sections added: what a church page looks like publicly, fees stated plainly (0% SiteViral margin on offerings, only the processor cost), verification/KYB, and a short FAQ answering the questions pastors actually ask.
- Same treatment applies to the `ChurchCallout` block: it stops living on the homepage and moves into the footer + nav as a single clear link.

## 3. Footer cleanup

The current footer has six columns with dead or wrong links (`/#how` anchor that doesn't exist on the hub, "Activity" pointing at a private dashboard, marketplace-era wording). New footer:

- **Create** — write a book, create a formation, create my platform
- **Discover** — explore, books, formations
- **Earn** — affiliate program, become an ambassador
- **Churches & NGOs** — SiteViral for Churches, create a church space
- **Company** — about, contact, help, status
- **Legal** — terms, privacy, refunds, payouts, security

Every link verified to resolve to a real public route; the tagline is rewritten from the old marketplace line to the creation promise.

## 4. Persona pages folded in

The `/pour/*` persona pages already exist and are unlinked. They keep the same shared template but get the new hero structure, and the relevant ones (authors, teachers, coaches, churches, associations) get linked from the footer's Create column so they become real entry points you can share instead of orphan pages.

## Technical notes

- New: `src/components/landing/AuthorHero.tsx`, `AnnouncementStrip.tsx`, `ProductShot.tsx`, `src/components/landing/church/ChurchNav.tsx` + `ChurchFooter.tsx`.
- Edited: `LandingPage.tsx` (new section order), `LandingFooterCompact.tsx` (new columns), `ChurchesPage.tsx` (standalone shell + new sections), `PersonaLandingPage.tsx` (hero structure), `ChurchCallout.tsx` removed from the homepage.
- All colors through existing semantic tokens; no hardcoded palette. Reuse `Reveal`, `AutoScrollRail`, `PlatformStatsBar` so no new animation code.
- Proof numbers come from the existing live stats hook only — nothing invented.
- SEO per page: distinct title/description/canonical, single H1, FAQ JSON-LD on the church page.
- Mobile checked at 390px and desktop at 1280px with screenshots before I call it done.
