import { createFileRoute } from "@tanstack/react-router";
import PourJuristesPage from "@/pages/persona/PourJuristesPage";

export const Route = createFileRoute("/pour/juristes")({
  component: PourJuristesPage,
});
