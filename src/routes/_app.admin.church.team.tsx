import { createFileRoute } from "@tanstack/react-router";
import ChurchProTeam from "@/pages/church/ChurchProTeam";

export const Route = createFileRoute("/_app/admin/church/team")({
  component: ChurchProTeam,
});
