import { createFileRoute } from "@tanstack/react-router";
import DashboardRouter from "@/pages/DashboardRouter";

export const Route = createFileRoute("/_app/dashboard/home")({
  component: DashboardRouter,
});
