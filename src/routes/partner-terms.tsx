import { createFileRoute } from "@tanstack/react-router";
import PartnerTermsPage from "@/pages/PartnerTermsPage";

export const Route = createFileRoute("/partner-terms")({
  component: PartnerTermsPage,
});
