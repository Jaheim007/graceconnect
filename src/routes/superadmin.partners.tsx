import { createFileRoute } from "@tanstack/react-router";
import SuperadminPartners from "@/pages/superadmin/SuperadminPartners";

export const Route = createFileRoute("/superadmin/partners")({
  component: SuperadminPartners,
});
