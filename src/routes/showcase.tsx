import { createFileRoute } from "@tanstack/react-router";
import ShowcasePage from "@/pages/ShowcasePage";

export const Route = createFileRoute("/showcase")({
  component: ShowcasePage,
});
