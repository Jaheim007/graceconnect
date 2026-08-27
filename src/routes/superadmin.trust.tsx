import { createFileRoute } from "@tanstack/react-router";
import SuperadminTrust from "@/pages/superadmin/SuperadminTrust";

export const Route = createFileRoute("/superadmin/trust")({
  component: SuperadminTrust,
});
