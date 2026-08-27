import { createFileRoute } from "@tanstack/react-router";
import PourMusiciensPage from "@/pages/persona/PourMusiciensPage";

export const Route = createFileRoute("/pour/musiciens")({
  component: PourMusiciensPage,
});
