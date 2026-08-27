import { createFileRoute } from "@tanstack/react-router";
import SuperadminSettings from "@/pages/superadmin/SuperadminSettings";

export const Route = createFileRoute("/superadmin/settings")({
  component: SuperadminSettings,
});
