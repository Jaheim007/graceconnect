import { createFileRoute } from "@tanstack/react-router";
import PourMediasPage from "@/pages/persona/PourMediasPage";

export const Route = createFileRoute("/pour/medias")({
  component: PourMediasPage,
});
