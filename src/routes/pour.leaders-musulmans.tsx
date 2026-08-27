import { createFileRoute } from "@tanstack/react-router";
import PourLeadersMusulmansPage from "@/pages/persona/PourLeadersMusulmansPage";

export const Route = createFileRoute("/pour/leaders-musulmans")({
  component: PourLeadersMusulmansPage,
});
