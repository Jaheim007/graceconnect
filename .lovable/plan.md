# Pages SiteViral needs to scale like a mature SaaS

The Paystack references show the pattern: a **Developers** hub (Overview, Documentation, API reference, Integrations, Status), a real **Support / Help Center** with searchable articles and categories, and a **Learn / Company** column (Blog, Guides, Video tutorials, About, Changelog, Careers, Brand, Media kit, Newsletter).

SiteViral already has: `/help` (FAQ accordion), `/support` (ticketing), `/blog`, `/tutoriels`, `/status`, `/changelog`, `/presse`, `/etudes-de-cas`, `/pricing`, `/faq`, `/contact`, plus the legal set (terms, privacy, DPA, security, subprocessors, AML, refund, payout, acceptable use, compliance).

What is missing, grouped by what it unlocks.

## A. Developers hub — the biggest gap

SiteViral already ships an MCP server (so ChatGPT, Claude and Gemini can create books and courses), an embed script (`public/embed.js`), short links, webhooks and payment gateways. None of this is documented publicly.

1. **`/developers`** — Overview: what a developer or partner can build, the three entry points (MCP, embed, links), and where to get keys.
2. **`/docs`** — Documentation hub: a real docs layout (left sidebar of sections, searchable, anchored headings, code blocks with copy) covering Getting started, Connect an AI assistant (MCP), Embed checkout on your site, Products and pricing, Payments and payouts, Webhooks, Errors.
3. **`/docs/api`** — API / MCP tool reference: each MCP tool (`create_book_draft`, `add_book_chapters`, `create_course_from_prompt`, `get_my_credits`, `list_my_products`, …) with parameters, example request and example response, generated from the tool definitions already in `src/lib/mcp/tools/`.
4. **`/integrations`** — Integration catalogue: Mobile Money and card providers, Stripe, Canva, MCP assistants, WhatsApp sharing, embed widget. Each with a short "what it does / how to connect" card.
5. **Status** already exists at `/status` — it just needs to be linked from the Developers menu.

## B. Support & Help Center

6. **`/help` upgraded into a real Help Center**: searchable article index, category landing pages (`/help/:category`) and individual article pages (`/help/:category/:slug`) instead of one long accordion. Each article gets its own URL so it can be linked from support replies and indexed by search engines.
7. **`/help/getting-started`** — a guided first-week checklist (create platform → publish first product → set payout → share flyer), reusing the existing activation steps.
8. **`/glossaire`** — plain-language definitions (ebook, formation, paiement bloqué, KYC, ambassadeur, payout, crédits). Cuts repeat tickets and wins long-tail search.

## C. Company & growth

9. **`/about`** — currently redirects to `/landing`. A real About page: mission, who it is for, why Mobile Money payouts matter, the team if you want it.
10. **`/carrieres`** — Careers, if you are hiring.
11. **`/brand`** — Brand & media kit: logo files, colours, fonts, correct usage. Lets ambassadors, press and partners represent SiteViral properly.
12. **`/newsletter`** — Subscribe page (the "Subscribe" entry in the reference menu), feeding an email list.
13. **`/roadmap`** — What is shipping next plus a feature-request submission and upvote flow. Pairs with the existing changelog.
14. **`/comparaison`** — SiteViral vs Gumroad / Teachable / GoFundMe / manual WhatsApp + Mobile Money. High-intent SEO.
15. **`/plan-du-site`** — human-readable sitemap so all of the above is reachable in one place.

## D. Legal / operational pages still missing

16. **`/cookies`** — cookie policy, companion to the banner already displayed.
17. **`/mentions-legales`** — publisher identity, legal form, hosting provider (facts must come from you).
18. **`/copyright`** — content takedown procedure for a marketplace hosting user-uploaded books, courses and audio.
19. **`/report`** — single intake for scam, fraud, abuse and vulnerability reports.
20. **`/account/delete-data`** — public explanation of account deletion and data export/erasure requests.

Note: the Trust Center is Lovable-managed at `/.well-known/trust.html`; navigation should link to it rather than a new app-owned `/trust` page.

## Navigation

The landing nav gets two dropdown menus matching the reference pattern:

```text
Developers ▾            Resources ▾              Company ▾
  Overview                Blog                     About
  Documentation           Guides                   Changelog
  API reference           Video tutorials          Pricing
  Integrations            Help center              Brand & media kit
  Status                  Glossary                 Careers
                          Roadmap                  Newsletter
```

The footer gains matching Developers / Resources / Company / Legal columns.

## Technical section

- New `DocsLayout` shell (sticky sidebar, mobile drawer, anchored headings, copy-to-clipboard code blocks) under `src/components/docs/`, used by `/docs` and `/docs/api`.
- Docs content stored as typed TS content modules (`src/content/docs/*.ts`) with FR/EN strings, so pages stay lazy-loaded and no CMS is needed. API reference entries are derived from the existing MCP tool definitions to avoid drift.
- Help Center articles stored the same way (`src/content/help/*.ts`) with category + slug, powering the index, category and article routes and a client-side search over titles and bodies.
- All pages use `SEOHead` with unique title, description and canonical, plus `FAQPage` / `TechArticle` JSON-LD where it applies; new URLs added to `public/sitemap.xml`.
- Bilingual FR/EN via `useI18n`, existing design tokens only.
- Routes registered in `src/App.tsx`, lazy-loaded, with FR/EN alias redirects (`/developpeurs` → `/developers`, `/documentation` → `/docs`).
- Backend needed only for: newsletter subscriptions, roadmap feature requests and upvotes, and the abuse report form — each as a table with GRANTs and RLS in the same migration. Everything else is static.

## Suggested first batch

Section A (Developers hub: `/developers`, `/docs`, `/docs/api`, `/integrations`) plus the nav and footer restructure — it is the largest credibility gap and the part that makes partners and AI assistants able to build on SiteViral. Section B next, then C and D.
