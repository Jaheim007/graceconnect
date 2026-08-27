import { createFileRoute } from "@tanstack/react-router";
import SuperadminChurch from "@/pages/superadmin/SuperadminChurch";

export const Route = createFileRoute("/superadmin/church")({
  component: SuperadminChurch,
});
