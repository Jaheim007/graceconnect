import { createFileRoute } from "@tanstack/react-router";
import PourSantePage from "@/pages/persona/PourSantePage";

export const Route = createFileRoute("/pour/sante")({
  component: PourSantePage,
});
