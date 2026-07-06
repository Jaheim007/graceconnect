# Project Memory

## Core
- Dark theme, Apple-like minimal. Primary #3B82F6, bg #0F172A.
- SF Pro Display headings, Inter body. Never serif.
- Supabase with RLS. Deployed on Vercel.
- Dashboard removed — confusing. Do not re-add.

## Memories
- [Hub & Navigation](mem://architecture/multi-vertical/hub-and-navigation-governance) — Root hub, Action Hub pattern, and 6 verticals (Digital, Beauty, Church, Home, Events, Learn).
- [Beauty Trust](mem://features/beauty/trust-and-safety-governance) — Anti-bypass, Gemini analysis, Trust Score.
- [Church MVP](mem://features/church/vertical-architecture) — Audio sermons, AI content pipeline, Giving (payout-only KYC gate).
- [Home MVP](mem://features/home/marketplace-logic) — Artisan marketplace, Dual OTP, terminologie "Artisan".
- [Events MVP](mem://features/events/marketplace-logic) — Vendor packages, Dual OTP, celebration theme.
- [Learn MVP](mem://features/education/marketplace-logic) — Tutor sessions, Dual OTP, teal/cyan theme. Public brand is "SiteViral Learn" (routes /learn); education_* tables remain.
- [Optimistic Chat](mem://ux/design/real-time-chat-behavior) — Real-time perception and bypass error handling.
- [Social Proof](mem://ux/design/social-proof-governance) — Suppression in workspaces and reduced frequency.
- [Mobile Performance](mem://ux/design/performance-optimization-standards) — Anti-blur scrolling policy for 60 FPS.
- [Platform Safeguards](mem://security/platform-safeguards) — JWT/HMAC validation for edge functions.
- [GeniusPay Migration](mem://payments/geniuspay-migration) — GP replaces Paystack for MoMo.
- [Bilingual Framework](mem://architecture/i18n/unified-bilingual-framework) — 100% FR/EN via useI18n.
