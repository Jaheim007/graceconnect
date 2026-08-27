import { createFileRoute } from "@tanstack/react-router";
import AdminProgramGenerating from "@/pages/admin/AdminProgramGenerating";

export const Route = createFileRoute("/_app/admin/programs/generating")({
  component: AdminProgramGenerating,
});
