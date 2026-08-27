import { createFileRoute } from "@tanstack/react-router";
import RefundPolicyPage from "@/pages/RefundPolicyPage";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
});
