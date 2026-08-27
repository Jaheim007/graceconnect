import { createFileRoute } from "@tanstack/react-router";
import MarketplaceTemplatesPage from "@/pages/MarketplaceTemplatesPage";

export const Route = createFileRoute("/marketplace/templates/")({
  component: MarketplaceTemplatesPage,
});
