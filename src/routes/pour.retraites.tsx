import { createFileRoute } from "@tanstack/react-router";
import PourRetraitesPage from "@/pages/persona/PourRetraitesPage";

export const Route = createFileRoute("/pour/retraites")({
  component: PourRetraitesPage,
});
