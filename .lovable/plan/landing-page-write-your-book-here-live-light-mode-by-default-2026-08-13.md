# Landing page: "Write your book here, live" + light mode by default

## Verdict on the big idea

The idea is **good — actually the best direction for the landing page**, but only if the free part is strictly capped. Here's the argument.

### Why it works
Rork, ChatGPT, YouTube, every modern product-led tool uses the same pattern: **the landing page is the demo.** They don't describe what they do; they let you do it. The user who comes to SiteViral doesn't want to "buy a writing tool" — they want to stop staring at a blank page. If the landing page writes their first chapter in real time, they get the emotional win before any signup gate. That is a much stronger hook than a headline and a screenshot.

The YouTube analogy is also precise: YouTube didn't say "upload videos and monetize"; it made the act of uploading effortless. For SiteViral, the equivalent is: type one sentence, see a book outline appear. The barrier between visitor and author collapses.

### The risk (and why it is still the right call)
The risk is cost. Generating an outline + chapter one is cheap; generating a full 8-chapter book with covers and images is not. So the free layer must stop at **outline + first chapter**. Everything after that is behind the account. This keeps the "wow" moment free without giving away the expensive product.

The risk of abuse is real, so we add a daily per-device/per-IP limit on guest previews. A few free previews per day is enough for a real visitor to test the promise; a bot farm hits the wall.

### One shared entry, not three separate landing pages
The three audiences (author, teacher, pastor/coach) share the same core need: **turn what they know into a book or formation they can sell**. One shared `/landing` hero is the right default because it avoids duplicating the expensive live-preview engine and keeps the brand simple. The headline can still speak to each audience by rotating the identity word.

Vertical pages stay for audiences with a genuinely different promise:
- `/churches` already exists for the giving/sermon use case.
- `/teachers` and `/coaches` can be added later if their messaging diverges far enough to need their own flow. For now, they share `/landing`.

### Headline options — moving past "Be the next"
"Be the next author" sounds like a motivational poster. The headline should feel like a **conversation starter**, not a claim. The live demo makes the strongest claim, so the text can be simpler.

Recommended direction (rotating identity, plain promise):

```text
FR: "Écris ton livre de [auteur] / [professeur] / [pasteur] / [coach] ici."
EN: "Write your [author] / [teacher] / [pastor] / [coach] book here."
```

Alternatives to test:

```text
FR: "De l'idée au livre. En un clic."
EN: "From idea to book. In one click."

FR: "Ton livre existe déjà. Il est juste encore dans ta tête."
EN: "Your book already exists. It's just still in your head."

FR: "Commence ton livre maintenant. Finis-le quand tu veux."
EN: "Start your book now. Finish it whenever you want."
```

The rotating identity can stay in the sub-headline or as a small animated badge if the main headline becomes too static.

## The new `/landing` flow

```text
1. Headline (plain, direct)                 "Écris ton livre ici."
2. Rotating identity badge (optional)        [auteur] → [professeur] → [pasteur] → [coach]
3. Sub-line                                  "De l'idée au livre, généré en direct."
4. One input + action                        "Quel livre veux-tu écrire ?"
   [ title / topic ..............................] [ Écrire mon livre ]
5. Live preview (no account, no credits)     animated outline + chapter 1 opening
6. The gate (only when preview is ready)     "Ton livre est prêt. Crée ton compte pour le garder,
                                             le finir et le vendre."
                                             -> Google / email / Apple (sheet on the same page)
7. After sign-up                             land in /ecrire preview step with the exact book
```

The input field replaces the current search bar, but it now has a clear job: it is the first sentence of their book. The examples below become one-tap starters.

## What stays free vs. what is gated
- Free, no account, no credits: a 6–10 chapter outline + the first 300–500 words of chapter 1.
- Gated behind account: saving the project, generating the full book, covers, illustrations, pricing, publishing, selling.

This preserves the magic moment while protecting our AI budget.

## Animated background (Rork feel, SiteViral execution)

Calm, slow, always-moving backdrop behind the hero:
- soft drifting gradient blobs in brand blue (30–40s loops),
- a faint dot grid or subtle grain so it reads premium, not "demo CSS",
- GPU-only transforms, disabled on reduced-motion,
- lighter on mobile to protect battery and scroll.

Works in both themes: light = pale blue haze on off-white; dark = deep navy glow.

## Light mode by default + theme toggle on public pages

- Default theme becomes **light** when the visitor has no saved preference. The saved preference still wins.
- A small sun/moon toggle returns to public pages: landing nav, church nav, public footer. Dark mode is not removed; it becomes a choice, not a forced default.

## One CTA, not two

The nav currently has "Créer ma plateforme" and "Créer un compte" side-by-side. That is confusing. We replace it with:
- primary (filled) button: **Créer ma plateforme**
- secondary (text): **Se connecter**
- language selector + theme toggle stay

For signed-in visitors, the avatar menu stays as today.

## Technical plan

- `AuthorHero.tsx` becomes a hero + live "book studio" panel. New `HeroAurora.tsx` for the animated background (CSS/Tailwind + framer-motion, no new dependency).
- New `guest-book-outline` Edge Function (verify_jwt = false): takes a title/topic + locale, returns chapter titles + chapter 1 opening, with per-IP daily rate limiting. No database writes for guests.
- Guest preview result held in `sessionStorage`. After signup, `/ecrire` picks it up and creates the real project using the existing `?project=`/`?idea=` deep-link logic in `WriteWizard.tsx`.
- Theme default changed in `src/contexts/ThemeContext.tsx` and `src/main.tsx` pre-render script. Theme toggle added to `LandingNav.tsx`, `ChurchNav.tsx`, and `LandingFooterCompact.tsx`.
- Nav CTA cleaned up in `LandingNav.tsx` only. No auth, payment, dashboard, or marketplace logic is touched.

## Out of scope
No changes to dashboards, pricing, marketplace data, or the church funnel beyond the theme toggle and the optional rotating identity words in the hero (which could be shared text only).
