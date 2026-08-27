import { createFileRoute } from "@tanstack/react-router";
import HomeDiscover from "@/pages/home/HomeDiscover";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/home/discover")({
  component: () => (
    showServiceSurfaces() ? <HomeDiscover /> : <Navigate to="/" replace />
  ),
});
