import { createFileRoute } from "@tanstack/react-router";
import VendrePage from "@/pages/VendrePage";

export const Route = createFileRoute("/vendre")({
  component: VendrePage,
});
