import { createFileRoute } from "@tanstack/react-router";
import PourFormateursPage from "@/pages/persona/PourFormateursPage";

export const Route = createFileRoute("/pour/formateurs")({
  component: PourFormateursPage,
});
