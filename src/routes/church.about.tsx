import { createFileRoute } from "@tanstack/react-router";
import ChurchLanding from "@/pages/church/ChurchLanding";

export const Route = createFileRoute("/church/about")({
  component: ChurchLanding,
});
