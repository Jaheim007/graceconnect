---
name: SiteViral Modular Platform PRD (July 2026)
description: Canonical product direction — one platform, siteviral_type per org, feature-flag activation, non-destructive migration of 250+ existing users.
type: feature
---

# SiteViral Modular Platform — PRD Reflection (July 2026)

## Core direction
One SiteViral platform. Each org picks a **siteviral_type** and gets a set of **enabled_features[]**. Dashboard + public page render only active features. Users can add more features later from an "Add More Functionalities" section. Existing 250+ users must be migrated non-destructively (default `digital_products`, keep all data/features, ask to confirm type).

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
- KYC never blocks page creation — only payout.
- Affiliation available for every type.
- Migration is non-destructive: keep account, products, sales, wallet, payout history, KYC, public page, affiliate data.
- Existing users default to `digital_products` but can change.
- Dashboard + public page render only from `enabled_features[]` — no hard-coded module lists.
- "Comments on digital products" ≠ "Reviews on person/establishment" — distinct systems.

## Onboarding flow (new users)
signup → choose siteviral_type → choose "what to do first" (checkboxes seeded with defaults) → activate min features → create page basics → publish → later add more.

## Migration flow (existing)
login → detect legacy → upgrade message (FR/EN) → confirm/change type (default `digital_products`) → merge existing active features with type defaults → new adaptive dashboard.
