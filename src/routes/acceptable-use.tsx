import { createFileRoute } from "@tanstack/react-router";
import AcceptableUsePage from "@/pages/AcceptableUsePage";

export const Route = createFileRoute("/acceptable-use")({
  component: AcceptableUsePage,
});
