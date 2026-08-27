import { createFileRoute } from "@tanstack/react-router";
import SuperadminDirectory from "@/pages/superadmin/SuperadminDirectory";

export const Route = createFileRoute("/superadmin/directory")({
  component: SuperadminDirectory,
});
