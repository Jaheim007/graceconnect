import { createFileRoute } from "@tanstack/react-router";
import SuperadminUsers from "@/pages/superadmin/SuperadminUsers";

export const Route = createFileRoute("/superadmin/users")({
  component: SuperadminUsers,
});
