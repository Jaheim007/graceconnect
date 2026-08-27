import { createFileRoute } from "@tanstack/react-router";
import PartenairesPage from "@/pages/PartenairesPage";

export const Route = createFileRoute("/partenaires")({
  component: PartenairesPage,
});
