import { createFileRoute } from "@tanstack/react-router";
import ChurchProSermons from "@/pages/church/ChurchProSermons";

export const Route = createFileRoute("/_app/admin/church/sermons/")({
  component: ChurchProSermons,
});
