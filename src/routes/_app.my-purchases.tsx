import { createFileRoute } from "@tanstack/react-router";
import ResourcesPage from "@/pages/ResourcesPage";

export const Route = createFileRoute("/_app/my-purchases")({
  component: ResourcesPage,
});
