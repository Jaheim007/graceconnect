import { createFileRoute } from "@tanstack/react-router";
import AdminMedia from "@/pages/admin/AdminMedia";

export const Route = createFileRoute("/_app/admin/media/")({
  component: AdminMedia,
});
