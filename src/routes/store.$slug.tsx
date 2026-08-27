import { createFileRoute } from "@tanstack/react-router";
import { StoreRedirect } from "@/routes/-redirect-helpers";

export const Route = createFileRoute("/store/$slug")({
  component: StoreRedirect,
});
