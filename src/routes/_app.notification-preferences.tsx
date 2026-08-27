import { createFileRoute } from "@tanstack/react-router";
import NotificationPreferencesPage from "@/pages/NotificationPreferencesPage";

export const Route = createFileRoute("/_app/notification-preferences")({
  component: NotificationPreferencesPage,
});
