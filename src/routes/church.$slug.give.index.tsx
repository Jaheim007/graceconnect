import { createFileRoute } from "@tanstack/react-router";
import ChurchGivePage from "@/pages/church/ChurchGivePage";

export const Route = createFileRoute("/church/$slug/give/")({
  component: ChurchGivePage,
});
