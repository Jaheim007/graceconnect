import { createFileRoute } from "@tanstack/react-router";
import DashboardExplorePage from "@/pages/dashboard/DashboardExplorePage";

export const Route = createFileRoute("/_app/dashboard/explore")({
  component: DashboardExplorePage,
});
