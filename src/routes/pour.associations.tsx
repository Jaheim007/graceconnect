import { createFileRoute } from "@tanstack/react-router";
import PourAssociationsPage from "@/pages/persona/PourAssociationsPage";

export const Route = createFileRoute("/pour/associations")({
  component: PourAssociationsPage,
});
