import { createFileRoute } from "@tanstack/react-router";
import SiteMapPage from "@/pages/SiteMapPage";

export const Route = createFileRoute("/plan-du-site")({
  component: SiteMapPage,
});
