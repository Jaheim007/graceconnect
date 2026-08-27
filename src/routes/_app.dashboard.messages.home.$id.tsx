import { createFileRoute } from "@tanstack/react-router";
import HomeConversation from "@/pages/home/HomeConversation";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/dashboard/messages/home/$id")({
  component: () => (
    showServiceSurfaces() ? <HomeConversation /> : <Navigate to="/dashboard/messages" replace />
  ),
});
