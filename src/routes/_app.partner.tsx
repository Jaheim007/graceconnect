import { createFileRoute } from "@tanstack/react-router";
import PartnerPortalPage from "@/pages/PartnerPortalPage";

export const Route = createFileRoute("/_app/partner")({
  component: PartnerPortalPage,
});
