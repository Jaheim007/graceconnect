import { createFileRoute } from "@tanstack/react-router";
import IntegrationsPage from "@/pages/resources/IntegrationsPage";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
});
