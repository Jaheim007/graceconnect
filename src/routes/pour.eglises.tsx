import { createFileRoute } from "@tanstack/react-router";
import PourEglisesPage from "@/pages/persona/PourEglisesPage";

export const Route = createFileRoute("/pour/eglises")({
  component: PourEglisesPage,
});
