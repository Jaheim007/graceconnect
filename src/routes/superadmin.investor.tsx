import { createFileRoute } from "@tanstack/react-router";
import SuperadminInvestorSnapshot from "@/pages/superadmin/SuperadminInvestorSnapshot";

export const Route = createFileRoute("/superadmin/investor")({
  component: SuperadminInvestorSnapshot,
});
