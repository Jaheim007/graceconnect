import { createFileRoute } from "@tanstack/react-router";
import ChurchProPrayer from "@/pages/church/ChurchProPrayer";

export const Route = createFileRoute("/_app/admin/church/prayer")({
  component: ChurchProPrayer,
});
