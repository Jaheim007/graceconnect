import { createFileRoute } from "@tanstack/react-router";
import PersonalMessagesPage from "@/pages/dashboard/PersonalMessagesPage";

export const Route = createFileRoute("/_app/dashboard/messages/")({
  component: PersonalMessagesPage,
});
