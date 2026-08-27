import { createFileRoute } from "@tanstack/react-router";
import SuperadminExports from "@/pages/superadmin/SuperadminExports";

export const Route = createFileRoute("/superadmin/exports")({
  component: SuperadminExports,
});
