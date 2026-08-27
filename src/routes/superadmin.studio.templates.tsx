import { createFileRoute } from "@tanstack/react-router";
import SuperadminGlobalTemplates from "@/pages/superadmin/studio/GlobalTemplatesManager";

export const Route = createFileRoute("/superadmin/studio/templates")({
  component: SuperadminGlobalTemplates,
});
