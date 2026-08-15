# Fix: chapters 2-8 arrive as one-line summaries after signup

## What happens today (verified)

On `/landing`, the `guest-book-outline` function returns a title, a subtitle, an outline (chapter title + **one-sentence summary**) and the full first chapter only. That preview is stored in `sessionStorage`.

After login, the write wizard reads that preview and maps each outline entry straight into a chapter body: chapter 1 gets the real opening text, chapters 2+ get their one-line summary as their content. It then opens the wizard directly on step 4 (Preview), so the full generation step is never run. That is exactly the "one line each" the user saw.

## The fix

1. **Treat the guest preview as an outline, not as finished content.** When the wizard boots from a landing preview, keep the title/subtitle/topic and the chapter titles, keep the real chapter 1 text, but do not put the one-line summaries into chapter bodies — store them as the outline plan for those chapters.
2. **Route the preview into the generation step (step 3) instead of jumping to step 4**, so the book is actually written before the user reviews it, with the familiar progress animation.
3. **Make the generation step honour a partially-filled book.** Its current "already has content, skip" check counts chapter titles as content, so it would skip. It will skip only when every chapter has a real body; otherwise it generates the missing chapters.
4. **Seed the generation with the outline** so the book the user was shown on the landing page is the book they get: pass the approved title, subtitle and chapter titles/summaries to `generate-book-content`, which writes each chapter to its planned brief. Chapter 1's existing text is preserved (regenerated only if the user asks).
5. Keep the current chapter count, language detection, tone and credit handling untouched; the guest preview outline defines the chapter count.

## Technical notes

- `src/components/write/WriteWizard.tsx` — `consumeGuestPreview()` stops writing `ch.summary` into `content`; it fills a new outline field (chapter title + brief) and boots at step 3 instead of step 4.
- `src/components/write/steps/StepGenerating.tsx` — the skip guard uses a "every chapter has a body" test rather than `hasGeneratedContent`; passes the outline through to the edge function and merges the returned chapter bodies onto the existing outline order, keeping chapter 1's landing text.
- `src/components/write/utils/hasGeneratedContent.ts` — add a stricter helper (all chapters have body text) next to the existing loose check, so other call sites keep their behaviour.
- `supabase/functions/generate-book-content/index.ts` — accept an optional `outline` array (title + summary) and an optional `skipChapters` set; when present, the prompt writes exactly those chapters under those titles instead of inventing its own outline.

## Verification

- Signed-out flow on `/landing`: enter a topic, sign up, confirm the wizard shows the generating animation and that chapters 2-8 land with full multi-paragraph bodies matching the outline titles seen on the landing page.
- Signed-in `/ecrire` flow and saved-draft resume must remain unchanged (no re-generation of existing books).
