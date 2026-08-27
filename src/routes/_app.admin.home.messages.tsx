import { createFileRoute } from "@tanstack/react-router";
import HomeProMessagesPane from "@/pages/home/pro/HomeProMessagesPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/messages")({
  component: () => (
    showServiceSurfaces() ? <HomeProMessagesPane /> : <Navigate to="/admin" replace />
  ),
});
