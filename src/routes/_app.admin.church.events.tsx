import { createFileRoute } from "@tanstack/react-router";
import ChurchProEvents from "@/pages/church/ChurchProEvents";

export const Route = createFileRoute("/_app/admin/church/events")({
  component: ChurchProEvents,
});
