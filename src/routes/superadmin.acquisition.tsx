import { createFileRoute } from "@tanstack/react-router";
import SuperadminAcquisition from "@/pages/superadmin/SuperadminAcquisition";

export const Route = createFileRoute("/superadmin/acquisition")({
  component: SuperadminAcquisition,
});
