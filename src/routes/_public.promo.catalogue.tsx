import { createFileRoute } from "@tanstack/react-router";
import PromoCataloguePage from "@/pages/promo/PromoCataloguePage";

export const Route = createFileRoute("/_public/promo/catalogue")({
  component: PromoCataloguePage,
});
