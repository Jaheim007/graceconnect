import { createFileRoute } from "@tanstack/react-router";
import ChurchProSettings from "@/pages/church/ChurchProSettings";

export const Route = createFileRoute("/_app/admin/church/settings")({
  component: ChurchProSettings,
});
