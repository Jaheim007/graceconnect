import { createFileRoute } from "@tanstack/react-router";
import SuperadminEmailLogs from "@/pages/superadmin/SuperadminEmailLogs";

export const Route = createFileRoute("/superadmin/emails")({
  component: SuperadminEmailLogs,
});
