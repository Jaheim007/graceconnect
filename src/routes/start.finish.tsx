import { createFileRoute } from "@tanstack/react-router";
import LazyStartFinishPage from "@/pages/start/StartFinishPage";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/start/finish")({
  component: () => (
    showServiceSurfaces() ? <LazyStartFinishPage /> : <Navigate to="/create-org" replace />
  ),
});
