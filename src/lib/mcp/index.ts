import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoAmI from "./tools/who-am-i";
import listMyOrganizations from "./tools/list-my-organizations";
import listOrgProducts from "./tools/list-org-products";
import listMyPurchases from "./tools/list-my-purchases";
import getOrgAnalytics from "./tools/get-org-analytics";
import createCourseFromPrompt from "./tools/create-course-from-prompt";
import createCourseFromText from "./tools/create-course-from-text";
import createBookDraft from "./tools/create-book-draft";
import getGenerationStatus from "./tools/get-generation-status";
import listMyDrafts from "./tools/list-my-drafts";
import getMyCredits from "./tools/get-my-credits";
import importBookFromContent from "./tools/import-book-from-content";
import addBookChapters from "./tools/add-book-chapters";
import importCourseFromContent from "./tools/import-course-from-content";
import addCourseLessons from "./tools/add-course-lessons";
import getDraftLink from "./tools/get-draft-link";
import finishDraftVisuals from "./tools/finish-draft-visuals";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "siteviral-mcp",
  title: "SiteViral MCP",
  version: "0.7.0",
  instructions:
    "Tools for SiteViral — the platform where creators build, sell and monetize digital content (books, courses, digital products).\n\n" +
    "TWO WAYS TO CREATE. Pick by where the content comes from:\n" +
    "1. IMPORT (default when the user developed the content with you). The user shaped the book or course in this conversation — audience, angle, chapter by chapter, lesson by lesson, possibly from their notes, audios or links. Use `import_book_from_content` / `import_course_from_content`, then `add_book_chapters` / `add_course_lessons` for the remaining batches (max 12 items per call, always pass start_order AND total_chapters/total_lessons). Send the COMPLETE final text you wrote together, never a summary — SiteViral assembles it and does not rewrite a single sentence. Thin payloads are rejected.\n" +
    "2. GENERATE (only when the user has just an idea and wants SiteViral to write it). Use `create_course_from_prompt`, `create_course_from_text` or `create_book_draft`, then poll `get_generation_status`.\n\n" +
    "BEFORE ANY IMPORT, ask one question about visuals: none / cover only / cover + one image per chapter or lesson / images only. Never assume, never generate visuals the user did not ask for.\n\n" +
    "CREDITS — NEVER TALK ABOUT THEM. Do not quote, estimate, sum, or announce credit costs, and do not report balances unless the user explicitly asks 'how many credits do I have?'. Creating content just works. The ONLY time credits come up is when a tool returns an insufficient-credits message: repeat that message as-is with the top-up link, and nothing else.\n\n" +
    "IDS. After an import, the reply prints project_id and org_id. Reuse those exact values for the next batch. NEVER invent, guess or send placeholder ids — if you no longer have them, call `add_book_chapters` / `add_course_lessons` without ids and SiteViral appends to the same draft.\n\n" +
    "FINISH THE IMPORT. Always declare the real total (total_chapters / total_lessons) on the first call. Every reply tells you how many items are in the draft out of that total; while items are missing you MUST keep calling add_book_chapters / add_course_lessons in the same turn and must NOT tell the user the book or course is ready. A 16-chapter book that lands as 6 chapters is a failure.\n\n" +
    "VISUALS COME IN BATCHES OF 6. When a reply says illustrations are still missing, call `finish_draft_visuals` again in the same turn until none remain — a 16-chapter book with 6 images is a failure.\n\n" +
    "ALWAYS SHOW THE LINK. Every creation or status reply starts with the draft link on its own line. Show it to the user as a clickable link in your next message, every single time. `get_draft_link` re-fetches it on request.\n\n" +
    "Discovery: `who_am_i`, `list_my_organizations`, `list_org_products`, `get_org_analytics`, `list_my_purchases`, `list_my_drafts`.\n\n" +
    "Rules: never claim content is published — everything lands as a DRAFT that the creator reviews, prices and publishes inside the app. If the user has several workspaces, ask which one and pass its org_id.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoAmI,
    listMyOrganizations,
    listOrgProducts,
    listMyPurchases,
    getOrgAnalytics,
    getMyCredits,
    listMyDrafts,
    getDraftLink,
    importBookFromContent,
    addBookChapters,
    importCourseFromContent,
    addCourseLessons,
    finishDraftVisuals,
    createCourseFromPrompt,
    createCourseFromText,
    createBookDraft,
    getGenerationStatus,
  ],
});

