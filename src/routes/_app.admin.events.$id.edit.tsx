import { createFileRoute } from "@tanstack/react-router";
import { EventForm as AdminEventForm } from "@/pages/admin/AdminEventForm";

export const Route = createFileRoute("/_app/admin/events/$id/edit")({
  component: AdminEventForm,
});
