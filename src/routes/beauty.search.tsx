import { createFileRoute } from "@tanstack/react-router";
import BeautySearch from "@/pages/beauty/BeautySearch";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/beauty/search")({
  component: () => (
    showServiceSurfaces() ? <BeautySearch /> : <Navigate to="/" replace />
  ),
});
