import { createFileRoute } from "@tanstack/react-router";
import PourCooperativesPage from "@/pages/persona/PourCooperativesPage";

export const Route = createFileRoute("/pour/cooperatives")({
  component: PourCooperativesPage,
});
