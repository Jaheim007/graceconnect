import { createFileRoute } from "@tanstack/react-router";
import PublicAffiliationPage from "@/pages/PublicAffiliationPage";

export const Route = createFileRoute("/ambassador-program")({
  component: PublicAffiliationPage,
});
