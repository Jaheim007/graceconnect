import { createFileRoute } from "@tanstack/react-router";
import ChurchesPage from "@/pages/ChurchesPage";

export const Route = createFileRoute("/churches")({
  component: ChurchesPage,
});
