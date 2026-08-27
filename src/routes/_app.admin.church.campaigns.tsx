import { createFileRoute } from "@tanstack/react-router";
import ChurchProCampaigns from "@/pages/church/ChurchProCampaigns";

export const Route = createFileRoute("/_app/admin/church/campaigns")({
  component: ChurchProCampaigns,
});
