import { createFileRoute } from "@tanstack/react-router";
import PourAgencesPage from "@/pages/persona/PourAgencesPage";

export const Route = createFileRoute("/pour/agences")({
  component: PourAgencesPage,
});
