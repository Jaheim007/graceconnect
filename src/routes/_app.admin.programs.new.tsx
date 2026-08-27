import { createFileRoute } from "@tanstack/react-router";
import AdminPrograms from "@/pages/admin/AdminPrograms";

export const Route = createFileRoute("/_app/admin/programs/new")({
  component: AdminPrograms,
});
