import { createFileRoute } from "@tanstack/react-router";
import PourOngPage from "@/pages/persona/PourOngPage";

export const Route = createFileRoute("/pour/ong")({
  component: PourOngPage,
});
