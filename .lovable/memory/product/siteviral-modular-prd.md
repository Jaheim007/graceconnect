---
name: SiteViral Modular Platform PRD (July 2026)
description: Canonical product direction — one platform, siteviral_type per org, feature-flag activation, non-destructive migration of 250+ existing users.
type: feature
---

# SiteViral Modular Platform — PRD Reflection (July 2026)

## Core direction
One SiteViral platform. **Account = the person/login. Workspace/page = the business/activity. Features = tools inside that workspace.** One user account can manage multiple workspaces/pages. Each workspace picks a **siteviral_type** and gets a set of **enabled_features[]**. Dashboard + public page render only the selected workspace’s active features. Users can add more features later from an "Add More Functionalities" section. Existing 250+ users must be migrated non-destructively (keep all data/features, ask to confirm type when needed).

## SiteViral types (9)
`church`, `digital_products`, `sport`, `artisans_home_services`, `beauty`, `tutors_home_teachers`, `instrumentists`, `influencers`, `services`.

Current codebase already has: church, digital, beauty, home (=artisans), events (subset), education (=tutors). Missing: sport, instrumentists, influencers, services. **Per user directive: hide verticals that don't fit the PRD until later — do NOT build new verticals now. Focus on the modular activation model.**

## Feature keys (13)
`appointment`, `digital_products`, `order_generator`, `donation_gifts`, `payment`, `ai_book_creation`, `ai_formation_creation`, `product_comments`, `location`, `events`, `reviews`, `kyc`, `affiliation`.

## Default features per type
- **church**: appointment, digital_products, order_generator, donation_gifts, payment, ai_book_creation, ai_formation_creation, product_comments, location, kyc, affiliation
- **digital_products**: digital_products, order_generator, donation_gifts, payment, ai_book_creation, ai_formation_creation, events, product_comments, kyc, affiliation
- **sport**: appointment, order_generator, payment, location, events, reviews, kyc, affiliation
- **artisans_home_services**: appointment, order_generator, payment, reviews, location, kyc, affiliation
- **beauty**: appointment, order_generator, payment, ai_book_creation, ai_formation_creation, reviews, location, kyc, affiliation
- **tutors_home_teachers**: digital_products, order_generator, reviews, location, kyc, affiliation
- **instrumentists**: appointment, order_generator, payment, reviews, location, kyc, affiliation
- **influencers**: appointment, order_generator, donation_gifts, reviews, kyc, affiliation
- **services**: appointment, digital_products, order_generator, payment, reviews, product_comments, kyc, affiliation

## Non-negotiable rules
- Never require a new user account for a new activity. Add features to the current workspace or create another workspace/page under the same account.
- The dashboard is one admin system, but it must always adapt to the currently selected workspace (`currentOrg`): selected organization + `siteviral_type` + `enabled_features[]`.
- If a user adds a new activity, ask whether to add it to the current workspace or create a new workspace/page. Adding to current merges features only and must not change `siteviral_type` unless explicitly requested.
- KYC never blocks page creation — only payout.
- Affiliation available for every type.
- Migration is non-destructive: keep account, products, sales, wallet, payout history, KYC, public page, affiliate data.
- Existing users default to `digital_products` but can change.
- There is ONE shared dashboard route/shell, but its home screen must be the currently selected SiteViral workspace. Example: `digital_products` users see a complete digital product dashboard; beauty users see appointments/services/payments/reviews/location for that salon.
- Do not show “activate KYC/payment/affiliation” as optional modules. KYC, payments/orders, and affiliation are platform essentials, surfaced as functionality inside the family dashboard/settings.
- Dashboard + public page render family-appropriate functionality from `siteviral_type` + `enabled_features[]` — no generic “active modules / available modules” dashboard as the main experience.
- "Comments on digital products" ≠ "Reviews on person/establishment" — distinct systems.

## Onboarding flow (new users)
signup → choose siteviral_type → choose "what to do first" (checkboxes seeded with defaults) → activate min features → create page basics → publish → later add more.

## Migration flow (existing)
login → detect legacy → upgrade message (FR/EN) → confirm/change type (default `digital_products`) → merge existing active features with type defaults → new adaptive dashboard.
