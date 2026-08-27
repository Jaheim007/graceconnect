import { createFileRoute } from "@tanstack/react-router";
import PourEtudiantsPage from "@/pages/persona/PourEtudiantsPage";

export const Route = createFileRoute("/pour/etudiants")({
  component: PourEtudiantsPage,
});
