import { createFileRoute } from "@tanstack/react-router";
import AdminPayouts from "@/pages/admin/AdminPayouts";

export const Route = createFileRoute("/_app/admin/payouts")({
  component: AdminPayouts,
});
