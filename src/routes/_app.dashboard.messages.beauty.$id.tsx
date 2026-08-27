import { createFileRoute } from "@tanstack/react-router";
import BeautyConversation from "@/pages/beauty/BeautyConversation";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/dashboard/messages/beauty/$id")({
  component: () => (
    showServiceSurfaces() ? <BeautyConversation /> : <Navigate to="/dashboard/messages" replace />
  ),
});
