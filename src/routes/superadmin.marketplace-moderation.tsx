import { createFileRoute } from "@tanstack/react-router";
import SuperadminMarketplaceModeration from "@/pages/superadmin/SuperadminMarketplaceModeration";

export const Route = createFileRoute("/superadmin/marketplace-moderation")({
  component: SuperadminMarketplaceModeration,
});
