import { createFileRoute } from "@tanstack/react-router";
import RoadmapPage from "@/pages/RoadmapPage";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
});
