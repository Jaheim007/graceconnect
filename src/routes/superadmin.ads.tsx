import { createFileRoute } from "@tanstack/react-router";
import SuperadminAds from "@/pages/superadmin/SuperadminAds";

export const Route = createFileRoute("/superadmin/ads")({
  component: SuperadminAds,
});
