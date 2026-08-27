import { createFileRoute } from "@tanstack/react-router";
import SuperadminRiskAML from "@/pages/superadmin/SuperadminRiskAML";

export const Route = createFileRoute("/superadmin/risk")({
  component: SuperadminRiskAML,
});
