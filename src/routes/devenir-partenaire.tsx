import { createFileRoute } from "@tanstack/react-router";
import BecomePartnerPage from "@/pages/BecomePartnerPage";

export const Route = createFileRoute("/devenir-partenaire")({
  component: BecomePartnerPage,
});
