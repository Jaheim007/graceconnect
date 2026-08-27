import { createFileRoute } from "@tanstack/react-router";
import { ProgramForm as AdminProgramForm } from "@/pages/admin/AdminProgramForm";

export const Route = createFileRoute("/_app/admin/programs/$id/edit")({
  component: AdminProgramForm,
});
