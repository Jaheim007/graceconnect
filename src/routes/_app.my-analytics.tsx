import { createFileRoute } from "@tanstack/react-router";
import UserAnalyticsPage from "@/pages/UserAnalyticsPage";

export const Route = createFileRoute("/_app/my-analytics")({
  component: UserAnalyticsPage,
});
