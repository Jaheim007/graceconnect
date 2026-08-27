import { createFileRoute } from "@tanstack/react-router";
import PourCreateursVideoPage from "@/pages/persona/PourCreateursVideoPage";

export const Route = createFileRoute("/pour/createurs-video")({
  component: PourCreateursVideoPage,
});
