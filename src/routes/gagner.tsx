import { createFileRoute } from "@tanstack/react-router";
import GagnerPage from "@/pages/GagnerPage";

export const Route = createFileRoute("/gagner")({
  component: GagnerPage,
});
