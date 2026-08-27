import { createFileRoute } from "@tanstack/react-router";
import TutorialsPage from "@/pages/TutorialsPage";

export const Route = createFileRoute("/tutoriels")({
  component: TutorialsPage,
});
