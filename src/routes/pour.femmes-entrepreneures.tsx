import { createFileRoute } from "@tanstack/react-router";
import PourFemmesEntrepreneurPage from "@/pages/persona/PourFemmesEntrepreneurPage";

export const Route = createFileRoute("/pour/femmes-entrepreneures")({
  component: PourFemmesEntrepreneurPage,
});
