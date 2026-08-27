import { createFileRoute } from "@tanstack/react-router";
import EducationConversation from "@/pages/education/EducationConversation";
import { Navigate } from "@/lib/router-compat";
import { showServiceSurfaces } from "@/lib/siteviral/visibility";

export const Route = createFileRoute("/_app/dashboard/messages/learn/$id")({
  component: () => (
    showServiceSurfaces() ? <EducationConversation /> : <Navigate to="/dashboard/messages" replace />
  ),
});
