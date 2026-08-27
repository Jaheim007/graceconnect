import { createFileRoute } from "@tanstack/react-router";
import ApiReferencePage from "@/pages/resources/ApiReferencePage";

export const Route = createFileRoute("/docs/api")({
  component: ApiReferencePage,
});
