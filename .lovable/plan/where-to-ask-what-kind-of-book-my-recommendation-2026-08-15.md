# Where to ask "what kind of book?" — my recommendation

## Recommendation: keep `/landing` neutral, ask once right after login

The landing input stays exactly as it is today: one field, one title, instant preview. No auto-detection of tone, no platform-type guessing. That keeps the magic moment fast and avoids the thing you rejected.

The style question moves to a **single quick step after login, before full generation**. That is the honest place for it: at that moment the user already has a title and an outline in front of them, so choosing "spiritual" or "business" is a concrete decision, not an abstract quiz before they've typed anything.

Why not on the landing page:
- Every extra choice before the first result lowers the conversion of the demo.
- A guest hasn't committed yet; asking them to categorise themselves is friction.
- Chapter 1 is cheap; re-tuning tone once they are logged in costs us nothing extra.

Why not skip it entirely:
- Without it, all books come out in the same generic voice, and a pastor's book reads like a marketing ebook. One tap fixes that.

## The flow after this change

```text
/landing
  title only -> instant outline + chapter 1 (neutral voice)
  -> "Create account / Sign in"

After login (new single step, ~5 seconds)
  "Quel style pour ton livre ?"
   Neutre  ·  Spirituel / Chrétien  ·  Guide d'étude
   Business  ·  Développement personnel  ·  Histoire / Récit
  optional: reading level (Simple / Standard / Approfondi)
  [ Générer mon livre ]  (skippable -> Neutre)

  -> Generation (free, our credits, as decided)
  -> Preview / edit
  -> Images (their choice, their credits)
  -> Publish: create platform -> title & description -> price
```

## Details

- One screen, 6 cards, single tap, big "Générer mon livre" button. Skip = Neutre, so it never blocks.
- The choice only changes **tone, vocabulary and chapter framing** in the generation prompt. It never changes the platform type (creator / church / NGO) — that stays an explicit choice at the create-platform step, as you asked.
- Chapter titles from the guest preview are preserved; the style only affects how the prose is written. If the user picks a non-neutral style, chapter 1 is rewritten in that voice so the book is consistent.
- Bilingual FR/EN through `useI18n`.

## Technical notes

- New step component `src/components/write/steps/StepBookStyle.tsx`, inserted in `WriteWizard.tsx` between the guest-preview handoff and `StepGenerating`. It shows only when the wizard was entered from a landing preview (`plannedOutline` present); the normal wizard already collects style in `StepParams`.
- Adds `bookTone` (and optional `readingLevel`) to the wizard state, passed to `generate-book-content` alongside the existing `outline` and `isLandingContinuation` flag.
- `generate-book-content` maps `bookTone` to a short system-prompt clause. No schema change, no credit change, no new tables.
- Nothing else is touched: auth, payments, dashboards, marketplace, platform creation stay as they are.

## Out of scope

No tone chips on the landing page, no auto-detection anywhere, no change to the free/paid credit rules already agreed.
