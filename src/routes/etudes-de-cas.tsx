import { createFileRoute } from "@tanstack/react-router";
import EtudesDeCasPage from "@/pages/EtudesDeCasPage";

export const Route = createFileRoute("/etudes-de-cas")({
  component: EtudesDeCasPage,
});
