import { createFileRoute } from "@tanstack/react-router";
import EducationProMessagesPane from "@/pages/education/pro/EducationProMessagesPane";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/admin/learn/messages")({
  component: () => (
    showServiceSurfaces() ? <EducationProMessagesPane /> : <Navigate to="/admin" replace />
  ),
});
