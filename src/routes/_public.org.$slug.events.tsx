import { createFileRoute } from "@tanstack/react-router";
import OrgPublicPage from "@/pages/OrgPublicPage";

export const Route = createFileRoute("/_public/org/$slug/events")({
  component: OrgPublicPage,
});
