import { createFileRoute } from "@tanstack/react-router";
import PromoGratuitsPage from "@/pages/promo/PromoGratuitsPage";

export const Route = createFileRoute("/_public/promo/gratuits")({
  component: PromoGratuitsPage,
});
