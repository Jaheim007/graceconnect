## What already exists (reuse, don't rebuild)

- `beauty_chat_violations` — logs blocked messages (created last round)
- `user_notifications` — in-app notification center
- `send-email` edge function + Resend
- `_shared/ai-gemini.ts` — direct Gemini call using `GEMINI_API_KEY` (your own key, not `LOVABLE_API_KEY`) ✅
- `has_role` / superadmin gating

## What to build now (phase 1 — essentials)

### 1. DB migration — trust core
- `account_trust_profiles` (user_id PK, trust_score 100 default, status enum: `ok | warned | chat_frozen | limited | hidden | suspended | banned`, `restricted_until`, `hidden_until`, `payout_hold`, counters)
- Extend `beauty_chat_violations`: `severity`, `ai_category`, `ai_confidence`, `ai_recommended_action`, `ai_admin_summary`, `ai_user_message`, `action_taken`, `admin_review_required`, `admin_reviewed_by`, `admin_decision`, `score_before`, `score_after`
- `trust_notifications_log` (user_id, violation_id, notification_type, channel `in_app|email`, subject, message, delivery_status, sent_at)
- Trigger on `beauty_chat_violations` insert → calls edge function `trust-process-violation` via `pg_net` (async)
- GRANTs + RLS (user sees own; superadmin sees all)

### 2. Edge function `trust-process-violation`
- Loads violation + user history (24h / 7d counts)
- Calls Gemini (`gemini-2.5-flash`, JSON mode) with the schema you listed → returns category, severity, confidence, recommended_action, user_message, admin_summary, review_required
- Applies automatic action per severity + history:
  - 1st soft → warning only
  - 2nd in 24h → chat frozen (this booking)
  - 3rd / hard → account limited + provider hidden + payout hold + admin review
  - severe (fraud) → 24h suspend + admin review (never auto-ban)
- Updates trust_score & `account_trust_profiles.status`
- Writes in-app notif (`user_notifications`) with short FR message
- Calls `send-email` with template key + logs both to `trust_notifications_log`

### 3. Email templates (in `send-email` template map)
9 short bilingual templates: warning, message_blocked, chat_frozen, account_limited, provider_hidden, payout_held, suspended_24h, banned, restored. Each: name + reason + action + "contact support if mistake".

### 4. Admin dashboard page `/superadmin/trust`
- List violations with Gemini analysis card (severity badge, confidence bar, recommendation)
- Filters: pending review, severity, user
- Action buttons: confirm / override / false positive / warn / freeze chat / hide / suspend 24h-7d-30d / ban / restore / hold-release payout
- Each action calls edge function `trust-admin-action` (audit-logged, sends notif + email)

### 5. User-facing surfacing
- Toast on blocked message (already done) — add link "Voir mon statut de compte"
- `/account/trust` page: current status, restrictions in effect, violation history (own), appeal button

## What I'm NOT building now (tell me if you want any)

- ❌ **Vertical-agnostic reuse layer** — build it Beauty-first, generalize later when a 2nd vertical needs it. Premature abstraction now = wasted work.
- ❌ **Automatic 7d / 30d / permanent ban** — too risky without human review. Auto caps at 24h suspend; longer = admin only.
- ❌ **Payout hold auto-release cron** — admin releases manually for now (low volume, safer).
- ❌ **Appeal ticket workflow** — the "contact support" mailto link is enough for v1; full ticketing later.
- ❌ **Gemini analysis on non-chat violations** (no-shows, disputes) — only chat bypass for now, since that's the only detector wired.
- ❌ **Trust badges on public profiles** (already in earlier backlog under reliability score) — separate feature.

## Tech notes
- Gemini call uses your `GEMINI_API_KEY` via existing `_shared/ai-gemini.ts` `geminiGenerateText` with `jsonMode: true`. Not `LOVABLE_API_KEY`.
- All auto-actions capped at 24h suspend, so a Gemini hallucination can't nuke an account.
- All notification sends double-logged so superadmin can audit "was the user told?"

Confirm and I'll ship phase 1 (migration → edge functions → admin page → user page). Or tell me which pieces to skip / add.