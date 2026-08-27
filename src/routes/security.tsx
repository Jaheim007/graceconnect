import { createFileRoute } from "@tanstack/react-router";
import SecurityPage from "@/pages/SecurityPage";

export const Route = createFileRoute("/security")({
  component: SecurityPage,
});
