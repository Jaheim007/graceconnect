import { createFileRoute } from "@tanstack/react-router";
import ChurchEventRegisterPage from "@/pages/church/ChurchEventRegisterPage";

export const Route = createFileRoute("/church/$slug/events/$eventId")({
  component: ChurchEventRegisterPage,
});
