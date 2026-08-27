import { createFileRoute } from "@tanstack/react-router";
import BeautyProConversationPane from "@/pages/beauty/pro/BeautyProConversationPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/messages/$id")({
  component: () => (
    showServiceSurfaces() ? <BeautyProConversationPane /> : <Navigate to="/admin" replace />
  ),
});
