import { createFileRoute } from "@tanstack/react-router";
import PourConsultantsPage from "@/pages/persona/PourConsultantsPage";

export const Route = createFileRoute("/pour/consultants")({
  component: PourConsultantsPage,
});
