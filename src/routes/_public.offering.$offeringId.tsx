import { createFileRoute } from "@tanstack/react-router";
import OfferingDetailPage from "@/pages/OfferingDetailPage";

export const Route = createFileRoute("/_public/offering/$offeringId")({
  component: OfferingDetailPage,
});
