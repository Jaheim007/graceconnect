import { createFileRoute } from "@tanstack/react-router";
import PourCentresFormationPage from "@/pages/persona/PourCentresFormationPage";

export const Route = createFileRoute("/pour/centres-formation")({
  component: PourCentresFormationPage,
});
