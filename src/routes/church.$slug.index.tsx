import { createFileRoute } from "@tanstack/react-router";
import ChurchPublicProfile from "@/pages/church/ChurchPublicProfile";

export const Route = createFileRoute("/church/$slug/")({
  component: ChurchPublicProfile,
});
