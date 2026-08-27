import { createFileRoute } from "@tanstack/react-router";
import CampaignDetailPage from "@/pages/CampaignDetailPage";

export const Route = createFileRoute("/_public/campaign/$campaignId")({
  component: CampaignDetailPage,
});
