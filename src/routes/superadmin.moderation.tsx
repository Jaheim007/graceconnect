import { createFileRoute } from "@tanstack/react-router";
import SuperadminModeration from "@/pages/superadmin/SuperadminModeration";

export const Route = createFileRoute("/superadmin/moderation")({
  component: SuperadminModeration,
});
