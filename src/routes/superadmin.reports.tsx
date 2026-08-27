import { createFileRoute } from "@tanstack/react-router";
import { SuperadminReports as LazySuperadminReports } from "@/pages/superadmin/SuperadminPages";

export const Route = createFileRoute("/superadmin/reports")({
  component: LazySuperadminReports,
});
