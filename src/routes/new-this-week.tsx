import { createFileRoute } from "@tanstack/react-router";
import NewThisWeekPage from "@/pages/NewThisWeekPage";

export const Route = createFileRoute("/new-this-week")({
  component: NewThisWeekPage,
});
