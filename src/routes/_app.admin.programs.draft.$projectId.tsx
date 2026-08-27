import { createFileRoute } from "@tanstack/react-router";
import AdminProgramDraftReview from "@/pages/admin/AdminProgramDraftReview";

export const Route = createFileRoute("/_app/admin/programs/draft/$projectId")({
  component: AdminProgramDraftReview,
});
