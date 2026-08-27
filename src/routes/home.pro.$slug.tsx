import { createFileRoute } from "@tanstack/react-router";
import HomeProviderPublic from "@/pages/home/HomeProviderPublic";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/home/pro/$slug")({
  component: () => (
    showServiceSurfaces() ? <HomeProviderPublic /> : <Navigate to="/" replace />
  ),
});
