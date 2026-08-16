# Reliable attributed sharing and automatic commissions

## Goal
Make every product-sharing action use the correct link for the person sharing, and make ambassador commissions automatic for paid digital products while preserving an owner-controlled off switch.

## Implementation

### 1. One attributed-link resolver
- Create one reusable resolver for product share URLs instead of rebuilding links independently in cards, product pages, flyers, post-purchase screens, and ambassador tools.
- For a signed-in non-owner sharer, fetch or create their active ambassador code and append `?ref=<code>` before creating any short/social-preview link.
- Preserve the referral query parameter through short links and fallback links.
- Owners/managers share the canonical seller link rather than enrolling themselves as ambassadors; signed-out visitors share the canonical product link.
- Return an explicit failure when attribution was expected but enrollment failed, rather than silently sharing an unattributed link.

### 2. Correct every sharing channel
- Route WhatsApp, Facebook, X, Telegram, native share, copy link, email, QR code, flyer QR, and flyer captions through the resolved URL.
- Fix the flyer race where the dialog opens before the newly created ambassador code reaches component state.
- Ensure flyer captions use the effective attributed/shortened link, not the original product URL.
- Standardize social endpoints and parameters: current X intent endpoint, Telegram share URL, Facebook sharer, and encoded WhatsApp text.
- Keep product slugs/routes canonical and remove inconsistent legacy product paths where found.

### 3. Automatic commission policy
- Set new workspaces to automatic ambassador commissions for paid digital products, using a clear default rate.
- Keep an explicit owner setting to disable or re-enable the program; an owner’s manual choice must persist and must not be silently reversed by later book/product creation.
- Remove the book wizard’s implicit organization-wide rate overwrite. Save the selected rate as a product override only when appropriate.
- Make manual product and course forms show the real effective state and rate at publication; disabled means no ambassador payout copy or misleading fee breakdown.
- Keep free products, donations, offerings, and booking/service payments outside ambassador payout unless they already have an explicitly supported product-sale model.

### 4. Backend consistency and migration
- Add the minimum organization preference state needed to distinguish “automatic” from “owner disabled,” so future creation flows do not re-enable an intentional opt-out.
- Update the shared workspace-creation engine and book/product/course publication paths to follow that preference.
- Preserve existing transaction safeguards: commission only for a valid active code, the correct organization, a paid product sale, and never the buyer’s own referral.
- Avoid retroactively changing completed sales. Existing organizations keep their current enabled/disabled state; automatic behavior applies consistently after the owner enables it or for newly created workspaces.

### 5. Interface audit and verification
- Audit product detail, marketplace cards, ambassador marketplace, seller product list/export, flyer generator, QR poster, post-purchase sharing, course sharing, and earnings sharing.
- Add focused tests for referral preservation through short links, channel URL construction, owner versus ambassador behavior, enrollment failure, and commission precedence (product override → organization default).
- Run authenticated browser checks on desktop and mobile: generate each share action, inspect its destination URL, complete a referral capture flow, and verify the resulting transaction attribution without creating duplicate affiliate links.

## Technical notes
- The database currently uses `organizations.affiliation_enabled` as the payout gate and `digital_products.commission_rate` as the optional per-product override; transaction processing already applies product override before organization default.
- The flyer currently builds QR imagery from an effective link but builds captions from the original link, and the product page can open the flyer before the affiliate-code state refreshes. Both paths will be consolidated rather than patched independently.
- No historical commission or completed payment records will be rewritten.