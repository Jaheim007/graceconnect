import { createFileRoute } from "@tanstack/react-router";
import DPAPage from "@/pages/DPAPage";

export const Route = createFileRoute("/dpa")({
  component: DPAPage,
});
