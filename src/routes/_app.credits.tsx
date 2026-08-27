import { createFileRoute } from "@tanstack/react-router";
import CreditsPage from "@/pages/CreditsPage";

export const Route = createFileRoute("/_app/credits")({
  component: CreditsPage,
});
