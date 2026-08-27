import { createFileRoute } from "@tanstack/react-router";
import AdminOfferings from "@/pages/admin/AdminOfferings";

export const Route = createFileRoute("/_app/admin/offerings")({
  component: AdminOfferings,
});
