import { createFileRoute } from "@tanstack/react-router";
import SuperadminCommandCenter from "@/pages/superadmin/SuperadminCommandCenter";

export const Route = createFileRoute("/superadmin/command-center")({
  component: SuperadminCommandCenter,
});
