# Connect SiteViral to ChatGPT, Claude & Gemini (Creation over MCP)

## The idea, in plain terms

A creator opens ChatGPT (or Claude, or any AI assistant that supports connectors) and says:

> "Create a course on SiteViral about selling on WhatsApp, premium tier, in French."

The assistant asks SiteViral to do it. SiteViral checks who the user is, charges their credits, runs **the same generation engine the app already uses**, and the draft shows up in their Creators Studio, ready to review, price and publish.

The assistant never writes the book itself and never gets to publish anything. It sends the brief; SiteViral creates.

## Good news: half of it already exists

SiteViral already exposes a secure connector (an MCP server) at
`https://<project>.supabase.co/functions/v1/mcp`, protected by real user sign-in
(OAuth) with a consent screen. Today it only offers **read** tools:
who am I, my organizations, my products, my purchases, org analytics.

So this phase is not "build a new integration" — it's "add the creation tools
and make the connection easy to set up."

## What gets added

### 1. Creation tools (the core)

| Tool | What the assistant can do | Engine used |
| --- | --- | --- |
| `create_course_from_prompt` | Start a course from a plain brief (topic, tier, level, language, illustrations yes/no) | existing `course-from-document` pipeline |
| `create_course_from_text` | Same, but from pasted notes/transcript text | same pipeline |
| `create_book_draft` | Start an ebook: title, audience, angle → outline generated | existing Studio job engine (`ai-create-job` + `ai-run-job`) |
| `get_generation_status` | Report live progress ("Course 62% — 9 lessons written") | reads the existing jobs table |
| `list_my_drafts` | List recent drafts with their status and app links | existing projects table |
| `get_my_credits` | Show balance and the cost of a request before launching it | existing credits |

Every creation tool returns a **direct link into the app** (the draft in Creators
Studio), so the user's next step is one click.

### 2. Hard rules baked into the tools

- **Nothing is ever published by an assistant.** Everything lands as a draft. Pricing, publishing and the AI-course price rules stay in the app, where the user decides.
- **Credits are charged by the existing functions**, with the same checks and the same error messages ("not enough credits") passed back to the assistant.
- **One engine only.** The tools call the existing edge functions; no second generation path is created.
- **The user's own identity.** Tools act as the signed-in SiteViral user, so they only ever see and write to their own platforms, with the same permission rules as the app (owner/admin/editor).
- **Fast responses.** Generation runs in the background job queue; the tool answers immediately with a job id, and the assistant polls status. This avoids the assistant timing out mid-generation.

### 3. A "Connect to ChatGPT / Claude" page in the app

New card in platform Settings → **Assistant connections**:

- one-click copy of the connector URL,
- short step-by-step for ChatGPT (Connectors), Claude (Custom connector) and other MCP clients,
- an explanation of what an assistant can and cannot do (create drafts, read your own data — never publish, never spend beyond the credits you already have),
- link to disconnect from the provider side.

## Where else this makes sense (my recommendation)

Phase 1 (this plan): **books and courses** — exactly where you pointed.

Worth adding right after, same pattern, small effort:

- **Sermons / church content** — "Create a sermon pack on Psalm 23" fits the existing church pipeline perfectly.
- **Course duplication into another language** — "Duplicate my English course in French" maps onto the duplication engine already built.
- **Digital product drafts** — a paid PDF/product page draft from a brief.

Not recommended over an assistant: payouts, giving/KYC, price changes, publishing,
deleting content. Those stay in the app on purpose.

## Technical notes

- Tools are added under `src/lib/mcp/tools/` and registered in `src/lib/mcp/index.ts`; the Vite MCP plugin regenerates `supabase/functions/mcp/index.ts`, which is then deployed and the MCP manifest re-extracted.
- Each tool builds a Supabase client with the verified bearer token (RLS as the user), then calls the existing edge function with that same token — so `can_use_studio`, membership roles, credit checks and audit logs all run unchanged.
- `create_course_from_prompt` / `create_course_from_text` wrap `course-from-document` (returns `project_id`, `job_id`). `create_book_draft` inserts an `ai_content_projects` row (type `ebook`), then `ai-create-job` with `job_type: generate_outline` and fires `ai-run-job`.
- `get_generation_status` reads `ai_generation_jobs` (status, progress, error) plus the project status, and returns a human sentence for the assistant to read aloud.
- Input schemas stay simple (plain strings/enums, no length bounds); prompts and lengths are validated in handler code with clear tool errors.
- Deep links use the published domain (`https://siteviral.com/...`) so the user can click straight from the assistant.
- Nothing in the web app changes except the new Settings card; existing dashboards, payments, marketplace and workspace logic are untouched.

## Verification before hand-off

- Confirm the Supabase OAuth authorization server is live for this project (a published app with a healthy Supabase connection enables it); if it is off, connecting from ChatGPT/Claude fails and needs a republish or a manual enable.
- Live check: connect from an MCP client, run `get_my_credits`, launch one course from a prompt, poll status to completion, then confirm the draft appears in Creators Studio with no price set and unpublished.
