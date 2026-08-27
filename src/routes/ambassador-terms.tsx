import { createFileRoute } from "@tanstack/react-router";
import AmbassadorTermsPage from "@/pages/AmbassadorTermsPage";

export const Route = createFileRoute("/ambassador-terms")({
  component: AmbassadorTermsPage,
});
