import { createFileRoute } from "@tanstack/react-router";
import MarketplaceTemplateDetailPage from "@/pages/MarketplaceTemplateDetailPage";

export const Route = createFileRoute("/marketplace/templates/$id")({
  component: MarketplaceTemplateDetailPage,
});
