import { createFileRoute } from "@tanstack/react-router";
import ShareTargetPage from "@/pages/ShareTargetPage";

export const Route = createFileRoute("/share-target")({
  component: ShareTargetPage,
});
