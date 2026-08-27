import { createFileRoute } from "@tanstack/react-router";
import CompliancePage from "@/pages/CompliancePage";

export const Route = createFileRoute("/compliance")({
  component: CompliancePage,
});
