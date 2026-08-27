import { createFileRoute } from "@tanstack/react-router";
import CreatorAdvancedAnalyticsPage from "@/pages/CreatorAdvancedAnalyticsPage";

export const Route = createFileRoute("/_app/creator/analytics")({
  component: CreatorAdvancedAnalyticsPage,
});
