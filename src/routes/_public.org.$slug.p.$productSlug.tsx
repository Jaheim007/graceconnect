import { createFileRoute } from "@tanstack/react-router";
import ProductDetailPage from "@/pages/ProductDetailPage";

export const Route = createFileRoute("/_public/org/$slug/p/$productSlug")({
  component: ProductDetailPage,
});
