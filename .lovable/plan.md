# Landing page: "Write your book here, live" + light mode by default

## The big idea (yes, it's the right one)

Your YouTube analogy is the strongest thing in this whole message: *YouTube made everyone a creator — SiteViral makes everyone an author.* So the landing page should not sell writing a book. It should **be** the writing of a book.

New hero flow, on `/landing` itself:

```text
1. Headline (the promise)          "YouTube made everyone a creator.
                                    SiteViral makes everyone an author."
2. One line, one field             "What book do you want to write?"
   [ title / topic ..............................] [ Write my book ]
3. Live generation, right there    animated: outline appears line by line
   (no account, no credits)        "Chapter 1... Chapter 2... Chapter 8"
4. Preview panel                   real chapter titles + the opening
                                   paragraphs of chapter 1, scrollable
5. The gate (only here)            "Your book is ready. Create your account
                                    to keep it, finish it and sell it."
                                   -> Google / email, in a sheet on the page
6. After sign-up                   land straight in /ecrire on the preview
                                   step, with the exact book they just made
```

The value is delivered *before* the ask. That's the whole trick, and it replaces the vague search bar — the field stays, but it stops being a "search bar" and becomes the book field, with a real result attached to it.

### What is free vs. gated
- Free for guests, no credits: the outline (chapter titles) + the opening of chapter 1.
- Gated behind sign-up: keeping the book, generating the full chapters, covers, images, pricing, publishing.

That keeps the "wow, it wrote my book" moment free without giving away the expensive full generation. To avoid abuse, guest generations are rate-limited per device/IP (a few per day) and the free taste never writes to a user's library until they sign up.

### Copy direction (talks to them, not about us)
Replace "Deviens le prochain auteur qui vit de ce qu'il enseigne" with something that names their real feeling: they already know something worth teaching, they've just never had a book. Examples to use:
- FR: "Tu sais déjà quelque chose que d'autres paieraient pour apprendre." / "Ton livre existe déjà. Il est juste encore dans ta tête."
- EN: "You already know something people would pay to learn." / "Your book already exists. It's just still in your head."
Sub-line stays concrete: written with AI, published on your own page, paid by Wave, Orange Money or MTN.

## Animated background (the Rork feel)

A calm, slow, always-moving backdrop behind the hero — not a gimmick:
- soft drifting gradient blobs (very slow, 30–40s loops) in brand blue,
- a faint grid / dot field that slowly parallaxes,
- a subtle grain overlay so it reads premium rather than "CSS demo",
- fully disabled on `prefers-reduced-motion`, GPU transforms only (`translate3d`, no layout thrash), lighter version on mobile.

It works in both themes: light = pale blue haze on near-white; dark = deep navy glow.

## Light mode as default + theme toggle back on public pages

- Default theme becomes **light** when the visitor has no saved preference (today it follows the OS, so most phones open dark). The saved preference still wins.
- A small sun/moon toggle returns to the public pages: landing nav, `/churches` nav, and the public footer — so light/dark is switchable everywhere, not only inside the app.

## One CTA, not two

The nav gets rid of the "Create an account" / "Create my platform" confusion:
- primary (filled) button: **Create my platform**
- secondary (text): **Sign in**
- language selector + theme toggle stay.
Signed-in visitors keep the avatar menu as today.

## Technical notes

- `AuthorHero.tsx` is rewritten into a hero + live "book studio" panel; new `HeroAurora.tsx` for the animated background (pure CSS/Tailwind keyframes + framer-motion, no new dependency).
- New public edge function `guest-book-outline` (verify_jwt = false) that takes a title/topic + locale and returns chapter titles plus the first chapter's opening, with per-IP daily rate limiting and no database write for guests. Uses the existing Gemini setup.
- The guest result is held in `sessionStorage`; after sign-up (existing auth sheet / `/auth` with a return path) `WriteWizard` picks it up and creates the real project, landing the user on the preview step. This reuses the existing `?project=`/`?idea=` deep-link logic already in `WriteWizard.tsx`.
- Theme default changes in `src/contexts/ThemeContext.tsx` and the pre-render script in `src/main.tsx`; toggle added to `LandingNav.tsx`, `ChurchNav`, `LandingFooterCompact.tsx`.
- Nav CTA cleanup in `LandingNav.tsx` only; no auth, payment or dashboard logic is touched.
- Mobile notifications (your other topic) are not in this plan — separate pass once the landing is done.

## Out of scope
No changes to dashboards, pricing, marketplace data or the church funnel beyond adding the theme toggle.
