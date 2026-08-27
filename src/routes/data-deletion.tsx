import { createFileRoute } from "@tanstack/react-router";
import DataDeletionPage from "@/pages/DataDeletionPage";

export const Route = createFileRoute("/data-deletion")({
  component: DataDeletionPage,
});
