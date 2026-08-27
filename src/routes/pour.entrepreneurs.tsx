import { createFileRoute } from "@tanstack/react-router";
import PourEntrepreneursPage from "@/pages/persona/PourEntrepreneursPage";

export const Route = createFileRoute("/pour/entrepreneurs")({
  component: PourEntrepreneursPage,
});
