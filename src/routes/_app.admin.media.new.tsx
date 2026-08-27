import { createFileRoute } from "@tanstack/react-router";
import { MediaForm as AdminMediaForm } from "@/pages/admin/AdminMediaForm";

export const Route = createFileRoute("/_app/admin/media/new")({
  component: AdminMediaForm,
});
