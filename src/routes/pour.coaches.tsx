import { createFileRoute } from "@tanstack/react-router";
import PourCoachesPage from "@/pages/persona/PourCoachesPage";

export const Route = createFileRoute("/pour/coaches")({
  component: PourCoachesPage,
});
