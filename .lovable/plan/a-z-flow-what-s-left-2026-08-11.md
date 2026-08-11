# A→Z flow: what's left

The navigation and surface simplification is done: one dashboard, one library (with Books / Courses / Receipts / Giving tabs), one intention screen, guest purchases claimed at login, orphan pages retired. Three real items remain, and none are new screens.

## 1. Activation emails never fire on their own
The activation ladder (D+1 → D+14) exists as an edge function but nothing calls it. Other engines in the project run on scheduled jobs; this one has none, so a user who signs up and stops gets no follow-up.

Action: add a once-a-day scheduled trigger for the activation engine, with an idempotency guard so a user can never receive the same stage twice.

## 2. First-run: the empty dashboard
A brand-new account with no purchase and no space lands on the unified home with blocks that are all empty states. The intention chosen at signup only reorders those blocks.

Action: when the account has zero activity, collapse the home into a single primary action derived from the intention (learn → Discover, create → create a space, earn → activate ambassador), and keep the rest as one quiet secondary row. No new page.

## 3. Checkout return path for guests
Guest purchases are now claimed at login, but the success page asks the guest to create an account without carrying the purchased item forward visually, so the reason to sign up is weak.

Action: on the success screen, show the purchased item plus a single "Save it to my library" action that pre-fills the email used at checkout, then land directly on the item in the library.

## Not worth doing
- Merging Discover and the SuperApp hub: they serve different intents and the service surfaces are already feature-gated.
- Further route pruning: remaining paths are intentional redirects that keep old links alive.

## Technical notes
- Item 1: scheduled job invoking the existing activation function; guard on the existing send-log so re-runs are safe.
- Item 2: purely presentational logic in the unified home using the existing capabilities hook and stored intention.
- Item 3: changes limited to the payment success screen and the claim call already wired into auth.
