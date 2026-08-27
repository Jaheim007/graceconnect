import { createFileRoute } from "@tanstack/react-router";
import BillingSuccessPage from "@/pages/BillingSuccessPage";

export const Route = createFileRoute("/billing/success")({
  component: BillingSuccessPage,
});
