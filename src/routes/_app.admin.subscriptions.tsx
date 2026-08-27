import { createFileRoute } from "@tanstack/react-router";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";

export const Route = createFileRoute("/_app/admin/subscriptions")({
  component: AdminSubscriptions,
});
