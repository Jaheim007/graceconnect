import { createFileRoute } from "@tanstack/react-router";
import PourFinancePage from "@/pages/persona/PourFinancePage";

export const Route = createFileRoute("/pour/finance")({
  component: PourFinancePage,
});
