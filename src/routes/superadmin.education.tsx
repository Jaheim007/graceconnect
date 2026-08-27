import { createFileRoute } from "@tanstack/react-router";
import SuperadminEducation from "@/pages/superadmin/SuperadminEducation";

export const Route = createFileRoute("/superadmin/education")({
  component: SuperadminEducation,
});
