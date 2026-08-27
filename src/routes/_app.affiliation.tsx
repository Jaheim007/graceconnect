import { createFileRoute } from "@tanstack/react-router";
import AffiliateCloudPage from "@/pages/AffiliateCloudPage";

export const Route = createFileRoute("/_app/affiliation")({
  component: AffiliateCloudPage,
});
