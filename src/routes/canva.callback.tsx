import { createFileRoute } from "@tanstack/react-router";
import CanvaCallbackPage from "@/pages/canva/CanvaCallback";

export const Route = createFileRoute("/canva/callback")({
  component: CanvaCallbackPage,
});
