import { createFileRoute } from "@tanstack/react-router";
import PourEnseignantsPage from "@/pages/persona/PourEnseignantsPage";

export const Route = createFileRoute("/pour/enseignants")({
  component: PourEnseignantsPage,
});
