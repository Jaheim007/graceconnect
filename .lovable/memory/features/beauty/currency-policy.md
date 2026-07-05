---
name: Beauty pricing currency policy
description: Service price currency is determined by the provider's payout currency, not the buyer.
type: feature
---
Each beauty provider has a single payout currency (from their payout profile / KYC).
- All services they list are priced in that currency.
- Checkout routes on that currency: XOF/GHS/KES → GeniusPay MoMo; everything else → Stripe.
- Buyers see the price in the provider's currency (no auto-conversion at checkout, per global currency policy).
- If the provider has no payout currency set, they cannot publish services.
