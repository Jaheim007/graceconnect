import { createFileRoute } from "@tanstack/react-router";
import ReelsPage from "@/pages/ReelsPage";

export const Route = createFileRoute("/_app/reels/")({
  component: ReelsPage,
});
