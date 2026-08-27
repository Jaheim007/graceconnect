import { createFileRoute } from "@tanstack/react-router";
import AdminPhotos from "@/pages/admin/AdminPhotos";

export const Route = createFileRoute("/_app/admin/photos")({
  component: AdminPhotos,
});
