# SEO / GEO / AEO / LLMO for SiteViral

## What I verified first (live, no JavaScript)

Cloudflare's AI-bot block is indeed off now — every crawler UA gets a normal `200`:

```text
GPTBot/1.0        -> 200, 9678 bytes, no <h1>
ClaudeBot/1.0     -> 200, 9678 bytes, no <h1>
PerplexityBot/1.0 -> 200, 9678 bytes, no <h1>
Googlebot/2.1     -> 200, 9678 bytes, no <h1>
facebookexternalhit -> 200, 9678 bytes (identical shell)
```

So the block was one problem, but not the whole one. Two findings:

1. **Content is still JS-only.** The raw HTML body is `<div id="root"></div>` plus one script tag. Titles/descriptions/JSON-LD are injected by `SEOHead` at runtime, so a non-JS crawler sees the generic homepage title on every URL — including `/discover`, product, course and org pages.
2. **`og-router` is not rewriting bot traffic today.** A `facebookexternalhit` request returns byte-identical HTML to a plain request, which means bots are not currently being routed to the `share-meta` edge function. The function exists and already emits per-entity title/description/`<h1>`, but nothing in front of the domain is sending crawlers to it. That is why previews and AI crawlers see an empty shell.

Approach chosen: **edge bot-rendering now, TanStack Start SSR migration as a later phase.**

## 1. Rendering fix — extend `share-meta` + `og-router`

- Upgrade `supabase/functions/share-meta` from an OG-tag responder into a full **bot HTML renderer**: real `<title>`, meta description, canonical, hreflang, `<h1>`, an intro paragraph, the entity's full description text as readable prose, key facts (price, currency, author/organization, lesson or chapter list, dates), internal links back to related pages, and inline JSON-LD.
- Add coverage for the public routes that matter: `/`, `/discover`, product pages, course/program pages, book pages, org/church/NGO/creator profiles and their sub-pages, campaigns, events, announcements, blog and guide pages, plus the static marketing/legal pages.
- Extend the bot UA list with the AI crawlers: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `CCBot`, `Bytespider`, `Amazonbot`, `meta-externalagent`, `DuckAssistBot`, `cohere-ai`, `YouBot`, `Applebot-Extended`, `MistralAI-User`.
- Serve identical substantive content to bots and humans (no cloaking): the bot HTML is the same text the React page renders, and every bot page keeps a canonical link to the normal URL.
- **Worker work you deploy:** since `og-router` already routes `siteviral.com/*`, I'll produce the exact routing snippet to add — match crawler UAs (and `?_bot=1` for testing), fetch `share-meta` with the original path, and pass everything else through untouched. `subdomain-proxy` gets the same rule for `*.siteviral.com` custom org domains. I'll also check what `fancy-cell-c610` does before touching it, since its purpose is unclear.
- Verification after deploy: `curl -A GPTBot ...` on a product page, a course page and an org profile, and confirm the real title, `<h1>`, body text and JSON-LD are in the raw HTML.

## 2. robots.txt — explicit AI crawler allowances

Edit `public/robots.txt` in place (keeping the existing Googlebot / Bingbot / social blocks and the private-route `Disallow` list): add named `Allow: /` blocks for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot, Bytespider, Amazonbot, meta-externalagent, DuckAssistBot, MistralAI-User, YouBot — each with the same private-path disallows so dashboards, auth, wallet and admin stay out. Keeps the `Sitemap:` line.

## 3. llms.txt — refresh, not create

`public/llms.txt` already exists and returns 200 in production, but it is out of date: it omits Developers/Docs/API, Tutorials, Roadmap, Glossary, Brand, Newsletter, Site map, Cookies/Legal/Copyright/Data deletion, the `/pour/*` persona pages and the promo pages, and it has no "what you can do here" answer block. I'll rewrite it with: a one-paragraph identity statement, a "Key facts" block (payment methods, currencies, regions, pricing model, ambassador commissions), grouped section links, and a short canonical Q&A section AI systems can quote directly. Bilingual FR/EN one-liners where it helps.

## 4. Structured data expansion

Extend `src/lib/jsonLdSchemas.ts` with `book`, `course`, `person` (creator), `itemList`, `howTo`, and `videoObject` helpers, then wire JSON-LD through `SEOHead` on:

- **Product / book pages** — `Product` + `Offer`, and `Book` (+ `WorkExample`/`Book` edition data) when the product is a book; `AggregateRating` when reviews exist.
- **Course / program pages** — keep and complete the existing `Course` schema: provider, `hasCourseInstance`, lesson count, `offers`, language.
- **Org / church / NGO / creator profiles** — `Organization` (or `Church`/`NGO` where accurate) with `logo`, `sameAs` socials, `address` when set; `Person` for individual creators; `ItemList` for their catalogue.
- **Campaigns, events, announcements** — `DonateAction`/`Event`/`Article`.
- **FAQ content** — `FAQPage` on `/faq`, `/help`, guide pages, pricing, and every page that gets the new FAQ block.
- **Breadcrumbs** — already emitted by `BreadcrumbNav`; extend it to the public detail routes that lack it.
- The same JSON-LD is emitted from the bot renderer in step 1, so non-JS crawlers see it too.

## 5. Direct-answer content blocks

Add a reusable `<AnswerBlock />` (question as a heading, 2–3 sentence answer, bilingual via `useI18n`) placed high on the page, and an `<FAQSection />` that renders questions + answers and feeds `FAQPage` JSON-LD from the same data. Roll out to: `/` landing, `/pricing`, `/vendre`, `/gagner`, `/ecrire`, `/churches`, `/ambassador-program`, `/faq`, `/help`, guide pages, and generic answer blocks on product/course/org pages ("What is this?", "How do I get it?", "How is payment handled?"). Content is written as real user questions ("Can I sell an ebook in Africa without a bank account?") with concise, quotable answers.

## 6. Sitemap — make it authoritative and automatic

Today there are two competing sitemaps: a hand-edited `public/sitemap.xml` (static, already missing routes and all dynamic content) and a dynamic `supabase/functions/sitemap` edge function that queries the database. The static file is what `siteviral.com/sitemap.xml` serves.

- Make the **edge function the single source of truth**: route `siteviral.com/sitemap.xml` to it through `og-router`, so new courses, books, products and profiles appear automatically as they are published.
- Audit and complete the edge function's static route list against the current router, mirroring each public loader's own filters (published/public only), and add a `sitemap.xml` index plus `sitemap-content.xml` if the URL count warrants splitting.
- Retire the hand-edited `public/sitemap.xml` (kept only as a fallback if the Worker route is not in place).
- I will not add `<lastmod>` values unless the row carries a real per-page updated timestamp; where `updated_at` exists it will be used.
- Then submit/re-submit the sitemap in Google Search Console via the connector and report the status it returns.

## Technical notes

- No changes to dashboards, auth, payments, marketplace data or workspace logic; all work is in `public/`, `src/components/seo`, `src/lib/jsonLdSchemas.ts`, presentation components, and the two edge functions.
- Cloudflare Worker code is the one piece I can't deploy for you — I'll hand you the exact snippet for `og-router` and `subdomain-proxy`.
- Final report will include: rendering status before/after with real `curl` output, robots.txt and llms.txt contents, the list of pages that gained structured data, and confirmation the sitemap updates automatically.
