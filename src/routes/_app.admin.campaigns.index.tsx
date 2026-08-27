import { createFileRoute } from "@tanstack/react-router";
import { AdminCampaigns as LazyAdminCampaigns } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/campaigns/")({
  component: LazyAdminCampaigns,
});
