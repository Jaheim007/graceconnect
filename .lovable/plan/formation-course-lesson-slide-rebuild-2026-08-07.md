**Formation: Course → Lesson → Slide rebuild**

Goal: turn the current Course → Module → Lesson (HTML blob) system into a real Course → Lesson → Slide system, with a slide builder, a document-to-course AI pipeline that produces a reviewable draft, resumable progress, shareable preview links, and server-issued certificates.

Nothing existing is deleted. Modules stay in the database as an optional grouping layer so published courses keep working during the transition.

**Before starting — two open decisions to state explicitly in this plan:**

1. **Certificate gating logic.** This plan introduces slide-level quizzes (`program_slides.data`) alongside the existing course-level assessment system (`program_quizzes` / `quiz_questions` / `quiz_attempts`). State explicitly whether slide-level quiz answers feed into `assessment_score` for certificate eligibility, or whether the certificate is gated only on the separate course-level assessment. Document this in the `issue_program_certificate` function's logic, not just in the app UI.
2. **AI pipeline cost/size cap.** Phase 3 (extract → segment → summarize → generate quiz questions per topic) has no stated limit. Define a max document size (pages/words) accepted for upload, and/or a chunking strategy for longer documents, so a large upload doesn't generate an unbounded number of AI calls or time out.

**Phase 1 — Slide data model**

New table `program_slides`:

- `id`, `lesson_id`, `display_order`
- `slide_type`: text | image | video | quiz | flashcard | assessment
- `title`, `body` (short rich text), `media_url`, `caption`
- `data` (jsonb) for type-specific payloads (quiz options, correct answer, explanation, flashcard front/back)
- `duration_seconds` (estimated), `created_at`, `updated_at`
- RLS: public read when the parent course is published; write for org owner/admin/editor. Grants for anon (read), authenticated, service_role.

Migration also adds a one-time backfill: for every existing lesson, run the same splitting logic currently in `parseContentSlides.ts` server-side and insert real slide rows, keeping `program_lessons.content` untouched as a fallback.

The player reads slides from the table when they exist and falls back to runtime HTML parsing when a lesson has none, so no published course breaks.

**Phase 2 — Course builder (from blank)**

Rework `/admin/programs/:id/edit`:

- Left rail: the Course → Lesson → Slide tree with drag-to-reorder at both levels and inline add/duplicate/delete.
- Center: a single-slide editor that switches form by slide type (short text, image upload, video URL/upload, quiz question with options + correct answer + explanation).
- Right: live phone-shaped preview of the selected slide, reusing `SlideRenderer`.
- Keep the existing lesson-level fields (title, free preview, duration) in a lesson settings panel.
- Keep `LessonEditor` reachable as "advanced / raw HTML" for legacy lessons.

**Phase 3 — Document → AI course pipeline**

New edge function `course-from-document`, replacing the current "upload file, pass URL in a prompt" behaviour:

- Extract text — real extraction per file type (PDF/DOCX/PPTX/TXT), page or section markers preserved.
- Segment into topics in original document order.
- For each topic: a short summary broken into 3–7 slide-sized chunks.
- For each topic: 1–3 generated quiz questions grounded in that topic's text.
- Assemble topics into ordered Lessons under one Course.
- Enforce the document size cap / chunking strategy defined above.

Output is written to a draft, not to live records: reuse `ai_content_projects` (`project_type = 'course_pack'`, structured slide tree in `data_json`) plus `ai_generation_jobs` for progress, so long documents stream status into the existing `CourseGenerationLoader`.

New review screen `/admin/programs/draft/:projectId`:

- Full generated tree, editable in place (rename, reorder, rewrite, delete slides, fix quiz answers).
- Per-lesson "looks good" marks and a source excerpt next to each lesson so the admin can check fidelity.
- A single explicit **Publish as course** action, which calls an extended `ai-project-to-program` that materialises real `programs` / `program_lessons` / `program_slides` rows. Publishing is never automatic; the created course starts as `publication_status = 'draft'` unless the admin opts in.

`ConvertDocumentDialog` and `CreateWithAIDialog` are re-pointed at this pipeline and stop writing courses directly from the browser.

**Phase 4 — Progress and resume**

Extend `program_enrollments`:

- `current_lesson_id`, `current_slide_id`, `last_active_at`
- `completed_slides` (uuid[]) for slide-level completion
- keep `progress_percent`, `assessment_score`, `total_stars`

`useSaveSlideProgress` is rewritten to write slide ids and `last_active_at`, and to compute `progress_percent` from completed slides over total slides. `/my-programs` and the course page show a "Resume — Lesson 3, slide 4 of 9" entry point that opens the player at the exact slide.

**Phase 5 — Sharing and guest preview**

- Canonical share URL `/program/:programId` with a copy-link + share sheet on the course page and in the admin list.
- Guests can open the course page and play slides marked as preview (lesson `is_free_preview`, or the first N slides of lesson 1) without an account; the paywall/sign-up prompt appears at the first gated slide, preserving the intent so sign-in returns to the same slide.
- Proper `<title>`, meta description, OG tags and Course JSON-LD on the course page so shared links render a real preview card.

**Phase 6 — Completion and certificate**

- Server-authoritative issuance: a `issue_program_certificate(program_id)` security-definer function verifies enrollment, slide completion, and — per the certificate gating logic defined above — the assessment score (when `require_assessment_for_cert`) before inserting the certificate and generating the number. RLS insert policy on `program_certificates` is tightened so the browser can no longer self-issue.
- One renderer: keep `generate-certificate-pdf` as the single output, and point `ProgramCertificate` / `CourseCompletionSlide` at it; the canvas image path is retired.
- Completion confirmation matches the other verticals: a confirmation screen, a notification, and the existing public `/verify/:certNumber` check.

**Technical notes**

- New table: `program_slides`. Altered: `program_enrollments`.
- New edge function: `course-from-document`. Extended: `ai-project-to-program`.
- New DB function: `issue_program_certificate`.
- Reused as-is: `program_quizzes` / `quiz_questions` / `quiz_attempts` for module- and course-level assessments; slide-level quizzes live in `program_slides.data`.
- `parseContentSlides.ts` stays as the legacy fallback and as the backfill reference implementation.
- Bilingual FR/EN via `useI18n` throughout, per project convention.

**Suggested order:** Phase 1 → 2 (blank builder usable) → 4 (progress/resume) → 3 (document AI with review) → 5 (sharing) → 6 (certificate). Each phase ships independently.