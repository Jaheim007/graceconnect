import { createFileRoute } from "@tanstack/react-router";
import AdminCreateHub from "@/pages/admin/AdminCreateHub";

export const Route = createFileRoute("/_app/admin/create")({
  component: AdminCreateHub,
});
