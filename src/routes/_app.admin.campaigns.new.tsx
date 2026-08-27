import { createFileRoute } from "@tanstack/react-router";
import { CampaignForm as AdminCampaignForm } from "@/pages/admin/AdminCampaignForm";

export const Route = createFileRoute("/_app/admin/campaigns/new")({
  component: AdminCampaignForm,
});
