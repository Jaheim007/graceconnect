import { createFileRoute } from "@tanstack/react-router";
import PayoutPolicyPage from "@/pages/PayoutPolicyPage";

export const Route = createFileRoute("/payout-policy")({
  component: PayoutPolicyPage,
});
