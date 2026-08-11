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

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "siteviral-mcp",
  title: "SiteViral MCP",
  version: "0.2.0",
  instructions:
    "Tools for SiteViral — the platform where creators build, sell and monetize digital content (books, courses, digital products).\n\n" +
    "Discovery: `who_am_i` verifies the connection, `list_my_organizations` lists the user's workspaces, `list_org_products`, `get_org_analytics` and `list_my_purchases` read data.\n\n" +
    "Creation: `create_course_from_prompt` (course from a brief), `create_course_from_text` (course from pasted notes/transcript), `create_book_draft` (ebook + AI outline). Generation runs in the background: each tool returns a job id, then poll `get_generation_status` until it completes. `get_my_credits` shows the balance and action costs before launching a generation; `list_my_drafts` lists recent drafts.\n\n" +
    "Rules: never claim content is published — every creation lands as a DRAFT that the creator reviews, prices and publishes inside the app. Generations consume the user's credits, so confirm the brief (topic, language, tier, illustrations) before calling a creation tool. If the user has several workspaces, ask which one and pass its org_id.",
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
    createCourseFromPrompt,
    createCourseFromText,
    createBookDraft,
    getGenerationStatus,
  ],
});
