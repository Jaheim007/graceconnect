import { createFileRoute } from "@tanstack/react-router";
import CreerFormationPage from "@/pages/CreerFormationPage";

export const Route = createFileRoute("/creer-formation")({
  component: CreerFormationPage,
});
