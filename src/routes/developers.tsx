import { createFileRoute } from "@tanstack/react-router";
import DevelopersPage from "@/pages/resources/DevelopersPage";

export const Route = createFileRoute("/developers")({
  component: DevelopersPage,
});
