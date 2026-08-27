import { createFileRoute } from "@tanstack/react-router";
import PourPodcastersPage from "@/pages/persona/PourPodcastersPage";

export const Route = createFileRoute("/pour/podcasters")({
  component: PourPodcastersPage,
});
