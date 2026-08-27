import { createFileRoute } from "@tanstack/react-router";
import ProductShortLinkPage from "@/pages/ProductShortLinkPage";

export const Route = createFileRoute("/_public/p/$key")({
  component: ProductShortLinkPage,
});
