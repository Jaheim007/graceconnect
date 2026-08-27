import { createFileRoute } from "@tanstack/react-router";
import DocsPage from "@/pages/resources/DocsPage";

export const Route = createFileRoute("/docs/")({
  component: DocsPage,
});
