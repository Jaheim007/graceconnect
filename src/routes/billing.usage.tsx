import { createFileRoute } from "@tanstack/react-router";
import BillingUsagePage from "@/pages/BillingUsagePage";

export const Route = createFileRoute("/billing/usage")({
  component: BillingUsagePage,
});
