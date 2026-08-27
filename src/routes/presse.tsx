import { createFileRoute } from "@tanstack/react-router";
import PressePage from "@/pages/PressePage";

export const Route = createFileRoute("/presse")({
  component: PressePage,
});
