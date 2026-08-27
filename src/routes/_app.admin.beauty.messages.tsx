import { createFileRoute } from "@tanstack/react-router";
import BeautyProMessagesPane from "@/pages/beauty/pro/BeautyProMessagesPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/beauty/messages")({
  component: () => (
    showServiceSurfaces() ? <BeautyProMessagesPane /> : <Navigate to="/admin" replace />
  ),
});
