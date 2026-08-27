import { createFileRoute } from "@tanstack/react-router";
import SuperadminSupport from "@/pages/superadmin/SuperadminSupport";

export const Route = createFileRoute("/superadmin/support")({
  component: SuperadminSupport,
});
