import { createFileRoute } from "@tanstack/react-router";
import SuperadminPush from "@/pages/superadmin/SuperadminPush";

export const Route = createFileRoute("/superadmin/push")({
  component: SuperadminPush,
});
