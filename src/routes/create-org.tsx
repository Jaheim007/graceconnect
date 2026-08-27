import { createFileRoute } from "@tanstack/react-router";
import CreateOrgPage from "@/pages/CreateOrgPage";

export const Route = createFileRoute("/create-org")({
  component: CreateOrgPage,
});
