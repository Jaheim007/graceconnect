import { createFileRoute } from "@tanstack/react-router";
import PromoAICreationsPage from "@/pages/promo/PromoAICreationsPage";

export const Route = createFileRoute("/_public/promo/ai-creations")({
  component: PromoAICreationsPage,
});
