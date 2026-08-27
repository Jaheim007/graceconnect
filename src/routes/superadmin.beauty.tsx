import { createFileRoute } from "@tanstack/react-router";
import SuperadminBeauty from "@/pages/superadmin/SuperadminBeauty";

export const Route = createFileRoute("/superadmin/beauty")({
  component: SuperadminBeauty,
});
