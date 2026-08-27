import { createFileRoute } from "@tanstack/react-router";
import SupportPage from "@/pages/SupportPage";

export const Route = createFileRoute("/_app/support")({
  component: SupportPage,
});
