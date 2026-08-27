import { createFileRoute } from "@tanstack/react-router";
import { SuperadminMetrics as LazySuperadminMetrics } from "@/pages/superadmin/SuperadminPages";

export const Route = createFileRoute("/superadmin/metrics")({
  component: LazySuperadminMetrics,
});
