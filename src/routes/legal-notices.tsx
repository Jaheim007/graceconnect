import { createFileRoute } from "@tanstack/react-router";
import LegalNoticesPage from "@/pages/LegalNoticesPage";

export const Route = createFileRoute("/legal-notices")({
  component: LegalNoticesPage,
});
