import { createFileRoute } from "@tanstack/react-router";
import AdminContentHub from "@/pages/admin/AdminContentHub";

export const Route = createFileRoute("/_app/admin/content")({
  component: AdminContentHub,
});
