import { createFileRoute } from "@tanstack/react-router";
import BrandKitPage from "@/pages/BrandKitPage";

export const Route = createFileRoute("/brand")({
  component: BrandKitPage,
});
