import { createFileRoute } from "@tanstack/react-router";
import ChurchProDashboard from "@/pages/church/ChurchProDashboard";

export const Route = createFileRoute("/_app/admin/church/")({
  component: ChurchProDashboard,
});
