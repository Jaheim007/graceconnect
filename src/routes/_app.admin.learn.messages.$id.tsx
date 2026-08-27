import { createFileRoute } from "@tanstack/react-router";
import EducationProConversationPane from "@/pages/education/pro/EducationProConversationPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/messages/$id")({
  component: () => (
    showServiceSurfaces() ? <EducationProConversationPane /> : <Navigate to="/admin" replace />
  ),
});
