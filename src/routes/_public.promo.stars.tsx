import { createFileRoute } from "@tanstack/react-router";
import PromoStarsPage from "@/pages/promo/PromoStarsPage";

export const Route = createFileRoute("/_public/promo/stars")({
  component: PromoStarsPage,
});
