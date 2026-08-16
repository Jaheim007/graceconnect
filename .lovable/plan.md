# Missing SaaS pages for SiteViral

SiteViral already covers a lot: pricing, FAQ, help, support, status, contact, terms, privacy, DPA, security, subprocessors, AML, refund/payout policy, acceptable use, compliance, blog, tutorials, case studies, press, changelog, testimonials, affiliate/partner programs and the `/pour/...` audience pages.

Below are the pages a mature SaaS is expected to have that are genuinely absent today, grouped by priority.

## Tier 1 — legally or operationally expected

1. **Cookie policy** (`/cookies`)
   Required companion to the cookie banner already shown on the site: what cookies are set, categories (essential, analytics), how to change consent. Banner and footer link to it.

2. **Legal notices / Mentions légales** (`/mentions-legales`)
   Standard for a French-language operator: publisher identity, legal form, contact, hosting provider. Content must come from you — I will not invent company details.

3. **Account & data deletion request** (`/account/delete-data`)
   A public, findable page explaining how to delete an account and request data export/erasure, plus the in-app path. Also an app-store and GDPR expectation.

4. **Copyright / content takedown (DMCA-style)** (`/copyright`)
   Essential for a marketplace hosting user-uploaded books, courses and audio: how a rights holder reports infringing content, what happens next, counter-notice.

5. **Report a problem / abuse** (`/report`)
   Single intake for scams, fraudulent sellers, abusive chat, and vulnerability reports (pointing at the existing security policy).

## Tier 2 — conversion and trust

6. **Integrations / Developers page** (`/integrations`)
   SiteViral already ships an MCP server so ChatGPT, Claude and Gemini can create content. Nothing public explains it. This page presents the MCP connection, the payment providers (Mobile Money, cards), Canva and the embed script.

7. **Comparison / alternatives page** (`/comparaison`)
   "SiteViral vs Gumroad / Teachable / GoFundMe / WhatsApp + manual Mobile Money", focused on local payouts and fees. High-intent SEO for the exact searches your audience runs.

8. **Roadmap / feature requests** (`/roadmap`)
   Public direction plus a way to submit and upvote requests. Complements the existing changelog.

9. **Glossary** (`/glossaire`)
   Explains ebook, formation, escrow/paiement bloqué, KYC, ambassadeur/commission, payout, credits. Reduces support load and builds long-tail SEO.

## Tier 3 — nice to have

10. **Careers** (`/carrieres`) — only if you are hiring.
11. **Accessibility statement** (`/accessibilite`) — commitment and contact for accessibility issues.
12. **HTML sitemap** (`/plan-du-site`) — human-readable index; `sitemap.xml` already exists for crawlers.

## Notes

- Trust Center: do not create an app-owned `/trust` page. Navigation should link to the Lovable-managed `/.well-known/trust.html` when it is available for this project.
- All legal pages will be written as SiteViral's own statements. For anything organization-specific (company identity, retention periods, certifications, subprocessor changes) I will ask you to supply or confirm the facts rather than assert them.

## Technical section

- New pages under `src/pages/legal/` and `src/pages/resources/`, each using `SEOHead` (title, description, canonical) and following existing page structure and design tokens.
- Bilingual FR/EN via `useI18n`, matching the pattern in existing static pages.
- Routes registered in `src/App.tsx` alongside the current public routes, lazy-loaded where the page is heavy, with FR/EN alias redirects (e.g. `/cookies` ↔ `/cookie-policy`).
- Footer (`LandingFooterCompact`) and `/help` gain a Legal and a Resources column linking the new pages.
- `public/sitemap.xml` updated with the new public URLs.
- Roadmap and feature requests, and the report/abuse form, need backend storage (a table plus RLS and grants) if you want submissions captured in-app rather than sent by email — confirm which you prefer.

## Suggested first batch

Tier 1 in full (cookies, legal notices, data deletion, copyright takedown, report a problem) plus the Integrations/Developers page, since it is the one with immediate marketing value.
