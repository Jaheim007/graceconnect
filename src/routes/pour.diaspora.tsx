import { createFileRoute } from "@tanstack/react-router";
import PourDiasporaPage from "@/pages/persona/PourDiasporaPage";

export const Route = createFileRoute("/pour/diaspora")({
  component: PourDiasporaPage,
});
