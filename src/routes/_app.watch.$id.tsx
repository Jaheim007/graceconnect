import { createFileRoute } from "@tanstack/react-router";
import WatchPage from "@/pages/WatchPage";

export const Route = createFileRoute("/_app/watch/$id")({
  component: WatchPage,
});
