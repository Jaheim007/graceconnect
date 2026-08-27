import { createFileRoute } from "@tanstack/react-router";
import ChurchGiveSuccessPage from "@/pages/church/ChurchGiveSuccessPage";

export const Route = createFileRoute("/church/$slug/give/success")({
  component: ChurchGiveSuccessPage,
});
