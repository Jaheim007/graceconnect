import { createFileRoute } from "@tanstack/react-router";
import ReportAbusePage from "@/pages/ReportAbusePage";

export const Route = createFileRoute("/report")({
  component: ReportAbusePage,
});
