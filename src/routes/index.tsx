import { createFileRoute } from "@tanstack/react-router";
import ActionHub from "@/pages/ActionHub";

export const Route = createFileRoute("/")({
  component: ActionHub,
});
