import { createFileRoute } from "@tanstack/react-router";
import HomeProConversationPane from "@/pages/home/pro/HomeProConversationPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/home/messages/$id")({
  component: () => (
    showServiceSurfaces() ? <HomeProConversationPane /> : <Navigate to="/admin" replace />
  ),
});
