import { createFileRoute } from "@tanstack/react-router";
import PourPhotographesPage from "@/pages/persona/PourPhotographesPage";

export const Route = createFileRoute("/pour/photographes")({
  component: PourPhotographesPage,
});
