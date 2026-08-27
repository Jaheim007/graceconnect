import { createFileRoute } from "@tanstack/react-router";
import PourMinisteresPage from "@/pages/persona/PourMinisteresPage";

export const Route = createFileRoute("/pour/ministeres")({
  component: PourMinisteresPage,
});
