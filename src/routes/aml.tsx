import { createFileRoute } from "@tanstack/react-router";
import AMLPage from "@/pages/AMLPage";

export const Route = createFileRoute("/aml")({
  component: AMLPage,
});
