# Bring your own content: ChatGPT / Claude / Gemini writes it, SiteViral assembles and keeps it

## The two modes

**Mode A — Import (new, and the one connected assistants should use most)**
The user does the whole reflection inside ChatGPT / Claude / Gemini — audience, angle, chapter by chapter, lesson by lesson, from their audios, links, notes. Then the assistant sends **the finished text** to SiteViral.

SiteViral does **not** rewrite a single sentence. It assembles: structures the chapters/lessons into a real book or course, builds the draft, and — only if asked — generates the cover and the illustrations.

**Mode B — Generate (unchanged)**
"Create me a course on X." Brief in, SiteViral's engine writes it. Exactly as today.

## Credits are never shown as numbers (your correction)

No assistant reply ever says "6 credits", "this will cost X", or shows a balance. It just works, quietly, the way data does on a phone — the user keeps creating, credits keep flowing, and they never feel a meter running.

What a reply looks like:

> Draft ready — 11 chapters, Premium import. Open it here: …

What it never looks like: *"Premium import, 6 credits, balance 14.5."*

The **only** moment credits are ever mentioned is when there aren't enough. Then the assistant says exactly one thing:

> Not enough credits on your SiteViral account. Add credits here: siteviral.com/credits — then ask me again.

Nothing is created and nothing is charged in that case. `get_my_credits` stays available if the user explicitly asks "how many credits do I have?", but the assistant is instructed never to volunteer it and never to quote costs before an action.

## Standard vs Premium — how we decide

Never by judging the content, and never by asking the user a word they don't understand.

In the app today, Standard/Premium is simply **size**: a Standard book caps at 8 chapters, Premium goes up to 20; a Standard course is 8–12 lessons, Premium 14–18.

So on import we derive it **mechanically from what the assistant actually sent**:

| What arrives | Tier applied |
| --- | --- |
| Book with 8 chapters or fewer | Standard |
| Book with 9–20 chapters | Premium |
| Course with 12 lessons or fewer | Standard |
| Course with 13+ lessons | Premium |

The reply names the tier ("Premium import") because that describes what they got — never the price.

## Images — the assistant asks, always

Someone connecting SiteViral to ChatGPT knows we generate visuals, so the instructions make the assistant ask one clear question before importing — **without prices**:

> "Do you want visuals? 1) None, 2) Cover only, 3) Cover + one image per chapter/lesson, 4) Images only."

Options on the import tools: `cover` (yes/no) and `illustrations` (`none` | `one_per_chapter` / `one_per_lesson`). If the user hasn't said anything, the assistant asks — it never assumes and never silently spends on visuals.

## Credits — what we actually charge for

You're right about the principle: **we don't charge for importing.** They already paid for their ChatGPT, and the connection to SiteViral is free. Pasting text in is not a service.

What we charge for is **generation** — the moment our AI does work:

| Situation | What our AI does | Charged |
| --- | --- | --- |
| Import, no visuals | Nothing generative — we assemble and store the text they wrote | **Small assembly fee, 1 credit** (book or course, any tier) |
| Import + cover | Generates a cover image | cover price, as in the app |
| Import + one image per chapter/lesson | Generates each image | per-image price, as in the app |
| "Generate it on SiteViral" (Mode B) | Writes the whole book/course | full generation price, as in the app |

The 1-credit assembly fee is deliberately small enough to be invisible — a free user's 20 daily credits covers 20 imports — but it isn't zero, so the pipeline can't be hammered for free, and it keeps the rule you set intact: everything that runs through our system touches credits.

**Nothing about existing in-app pricing changes.** Verified against the live price list; the connector reuses the exact same keys and amounts:

| What | In app today | Over MCP |
| --- | --- | --- |
| Full AI book (`generate_book`) | 18 / 30 | identical |
| Full AI course (`ai_course_structure`) | 16 / 28 | identical |
| Cover (`generate_cover`) | 7.5 / 12 | identical |
| Image per lesson (`ai_course_image`) | 1.5 / 2.5 | identical |

Margin logic: the expensive part is long-form generation and images, and both stay at full app price. Import skips the writing, so it costs almost nothing to serve — 1 credit covers the assembly, storage and PDF-ready build.

Money rules identical to the rest of the platform:
- Charged once, with an idempotency key — a retried tool call never double-charges, and re-sending a chunk never re-charges.
- Visuals charged separately, only when explicitly requested.
- Insufficient credits → the single message above, nothing created, nothing charged.
- Same hourly cooldowns and the same auto-refund if a generation fails.


## How we know which mode the user wants

Decided by **which tool the assistant calls**, and the names leave no room:

- `import_book_from_content` / `import_course_from_content` → "here's the text, don't touch it"
- `create_book_draft` / `create_course_from_prompt` → "here's the idea, write it"

Plus: import tools **refuse thin payloads** (a 200-character "chapter" is a summary — the tool errors and points to the generate tool), the connector instructions state the rule plainly, and every import reply says *"Imported verbatim — SiteViral did not rewrite your text."*

## The missing link problem (ChatGPT vs Claude)

Claude shows the draft link because it reads the tool reply; ChatGPT sometimes drops it. Fixes:

1. The link is the **first line** of every tool reply, on its own, and repeated in the structured result.
2. The reply ends with an explicit instruction: *"Show this draft link to the user as a clickable link in your next message."*
3. The connector instructions add a hard rule: after every creation or status check, always show the draft link.
4. A `get_draft_link` tool, so "give me the link" is one call away.

## What doesn't change
- Everything lands as a **draft** — no publishing, pricing or deleting from an assistant.
- Acts as the signed-in user, own workspace, owner/admin/editor rules unchanged.
- Books open at `/ecrire`, courses at `/admin/programs/draft/:id`.
- The existing generate tools stay exactly as they are.

## Technical notes

- New tools in `src/lib/mcp/tools/`: `import_book_from_content`, `add_book_chapters`, `import_course_from_content`, `add_course_lessons`, `get_draft_link`; registered in `src/lib/mcp/index.ts`, then the `mcp` function is redeployed and the manifest re-extracted.
- Long content arrives in chunks (chapters 1–3, then 4–6…) since one tool call can't carry a whole book. Appends are idempotent by order index. Tier is computed on the **final** chapter/lesson count: the import fee is taken at Standard on creation, and topped up by the difference if later appends push it into Premium.
- Two rows added to `credit_action_pricing` (`import_book`, `import_course`) by migration; existing rows untouched. Charging goes through the shared `consumeCreditsWithRefund` / `credit_transactions` helpers, so balances, alerts, history and refunds behave like every other action.
- A thin `import-content` edge function does the work, because credits must be debited server-side with the service role; the MCP tool calls it with the user's token, like the other creation tools.
- Book import writes `structure_json.chapters` / `data_json.chapters` (`{ id, title, content, order }`) — the shape `/ecrire`, the PDF export and product conversion already read. Course import writes the `course_pack` shape `ai-project-to-program` consumes (modules → lessons → slides); the exact mapping is verified against that function before the tool is written.
- Visuals reuse `ai-generate-course-cover` / `ai-generate-course-lesson-images` — no new image pipeline, no new prices.

## Verification
From both ChatGPT and Claude: develop a course in conversation, import it in 3 chunks with cover + one image per lesson, then check that (a) the lesson text in the app is byte-identical to what the assistant wrote, (b) the debit equals import fee + cover + images, charged once, (c) re-sending a chunk neither duplicates nor re-charges, (d) an 11-chapter book is billed Premium and says so, (e) the draft link shows up in both assistants, (f) a user below the fee gets a clean "insufficient credits" with nothing created, (g) an in-app book and course generation still debit exactly 18/16 as before.
