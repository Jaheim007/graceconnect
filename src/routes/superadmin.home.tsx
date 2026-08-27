import { createFileRoute } from "@tanstack/react-router";
import SuperadminHome from "@/pages/superadmin/SuperadminHome";

export const Route = createFileRoute("/superadmin/home")({
  component: SuperadminHome,
});
