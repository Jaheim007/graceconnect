import { createFileRoute } from "@tanstack/react-router";
import PourMissionnairesPage from "@/pages/persona/PourMissionnairesPage";

export const Route = createFileRoute("/pour/missionnaires")({
  component: PourMissionnairesPage,
});
