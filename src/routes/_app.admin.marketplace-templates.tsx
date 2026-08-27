import { createFileRoute } from "@tanstack/react-router";
import AdminMarketplaceTemplates from "@/pages/admin/AdminMarketplaceTemplates";

export const Route = createFileRoute("/_app/admin/marketplace-templates")({
  component: AdminMarketplaceTemplates,
});
