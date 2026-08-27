import { createFileRoute } from "@tanstack/react-router";
import SuperadminAiAbuse from "@/pages/superadmin/studio/AiAbuseMonitor";

export const Route = createFileRoute("/superadmin/studio/abuse-monitor")({
  component: SuperadminAiAbuse,
});
