import { createFileRoute } from "@tanstack/react-router";
import PersonalActivityPage from "@/pages/dashboard/PersonalActivityPage";

export const Route = createFileRoute("/_app/dashboard/activity")({
  component: PersonalActivityPage,
});
