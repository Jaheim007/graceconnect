import { createFileRoute } from "@tanstack/react-router";
import SuperadminActivityFeed from "@/pages/superadmin/SuperadminActivityFeed";

export const Route = createFileRoute("/superadmin/activity")({
  component: SuperadminActivityFeed,
});
