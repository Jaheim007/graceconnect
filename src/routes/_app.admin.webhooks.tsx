import { createFileRoute } from "@tanstack/react-router";
import AdminWebhooks from "@/pages/admin/AdminWebhooks";

export const Route = createFileRoute("/_app/admin/webhooks")({
  component: AdminWebhooks,
});
