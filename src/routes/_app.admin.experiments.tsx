import { createFileRoute } from "@tanstack/react-router";
import AdminExperiments from "@/pages/admin/AdminExperiments";

export const Route = createFileRoute("/_app/admin/experiments")({
  component: AdminExperiments,
});
