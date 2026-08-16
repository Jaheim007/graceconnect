# Responsive + smoothness audit: standalone pages, payment success, "Read now"

Goal: every page behaves like one clean mobile app — no content running under the bottom bar, no clipped cards, no jank when scrolling, and no error when opening a purchased book. Phone, tablet/iPad and desktop.

## 1. Fix the post-payment page (the screenshot)

What is wrong today: the success page is a fixed-height, vertically centered card (`min-h-screen flex items-center justify-center`) with its own inner scroll, and it renders outside the app shell while the global bottom bar still floats on top. On a phone the card is taller than the screen, so the content runs under the bottom nav and the page fights the browser for scrolling.

Changes:
- Turn the page into a normal top-aligned scrolling page: full-height wrapper using `100dvh` minimum, page scroll on the document, card centered horizontally only.
- Add bottom clearance using the existing nav-clearance/safe-area tokens so the last button is never under the bottom bar or the iOS home indicator.
- Widen the card responsively (comfortable single column on phone, wider card on tablet/desktop) instead of a fixed narrow column.
- Apply the same treatment to the loading and pending/error states so they don't jump between layouts.

## 2. Make it smooth on low-end phones

- The confetti burst renders 40 independently animated elements with random per-frame transforms — the main cause of the lag felt on that page. Reduce the count, run it once on GPU-friendly properties only, skip it entirely on small screens/reduced-motion, and unmount it when finished.
- The global route transition in `AppLayout` and `AdaptiveLayout` animates `filter: blur()` plus `scale` on every navigation, which is against the project's anti-blur scrolling policy and repaints the whole content area. Replace with an opacity/small-translate transition, and no transition at all when the user prefers reduced motion.
- Verify no page keeps a nested scroll container that double-scrolls inside the app shell's own scroll area.

## 3. Fix the "Read now" error

Cause: the handler awaits the watermark request and only then calls `window.open`, so mobile browsers treat it as a blocked popup and the page shows the generic "error opening" alert. Fix by opening the file through a user-gesture-safe path (same-tab navigation to the blob/inline URL, with an explicit "Open the file" fallback link if the browser still refuses), and make the error message accurate instead of blaming the file type.

## 4. Audit of the other standalone pages

Same class of problem exists on pages rendered outside the app shell (payment/billing success, embed checkout, invite, certificate verification, OAuth consent, maintenance, detail pages that center content in `min-h-screen`). For each one:
- top-aligned scrolling layout with `100dvh` and safe-area padding,
- bottom clearance for the mobile bar,
- responsive max-width so tablets/iPad don't show a tiny column in a large empty page,
- no inner scroll container.

Verification: drive the app in the sandbox browser at phone (390px), tablet (820px) and desktop (1280px) widths across the payment-success, purchases, product detail and reader flows, and capture screenshots to confirm nothing is clipped or hidden behind the nav.

## Scope guard

Presentation and layout only. No changes to payment logic, ambassador/commission logic, workspace or auth behaviour.
