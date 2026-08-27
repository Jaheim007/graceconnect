import { createFileRoute } from "@tanstack/react-router";
import TemoignagesPage from "@/pages/TemoignagesPage";

export const Route = createFileRoute("/temoignages")({
  component: TemoignagesPage,
});
