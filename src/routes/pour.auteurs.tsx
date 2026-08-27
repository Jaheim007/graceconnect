import { createFileRoute } from "@tanstack/react-router";
import PourAuteursPage from "@/pages/persona/PourAuteursPage";

export const Route = createFileRoute("/pour/auteurs")({
  component: PourAuteursPage,
});
