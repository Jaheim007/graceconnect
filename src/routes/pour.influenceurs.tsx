import { createFileRoute } from "@tanstack/react-router";
import PourInfluenceursPage from "@/pages/persona/PourInfluenceursPage";

export const Route = createFileRoute("/pour/influenceurs")({
  component: PourInfluenceursPage,
});
