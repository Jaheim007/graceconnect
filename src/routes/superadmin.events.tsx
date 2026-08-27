import { createFileRoute } from "@tanstack/react-router";
import SuperadminEvents from "@/pages/superadmin/SuperadminEvents";

export const Route = createFileRoute("/superadmin/events")({
  component: SuperadminEvents,
});
