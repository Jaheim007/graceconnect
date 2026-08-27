import { createFileRoute } from "@tanstack/react-router";
import EcrirePage from "@/pages/EcrirePage";

export const Route = createFileRoute("/ecrire")({
  component: EcrirePage,
});
