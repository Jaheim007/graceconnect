import { createFileRoute } from "@tanstack/react-router";
import OrgTemplates from "@/pages/admin/studio/OrgTemplates";

export const Route = createFileRoute("/_app/admin/studio/templates")({
  component: OrgTemplates,
});
