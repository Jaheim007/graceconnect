import { createFileRoute } from "@tanstack/react-router";
import AccountTrustPage from "@/pages/AccountTrustPage";

export const Route = createFileRoute("/account/trust")({
  component: AccountTrustPage,
});
