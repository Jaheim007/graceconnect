import { createFileRoute } from "@tanstack/react-router";
import SuperadminSettlements from "@/pages/superadmin/SuperadminSettlements";

export const Route = createFileRoute("/superadmin/settlements")({
  component: SuperadminSettlements,
});
