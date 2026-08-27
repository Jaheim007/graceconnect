import { createFileRoute } from "@tanstack/react-router";
import FoundersPage from "@/pages/FoundersPage";

export const Route = createFileRoute("/founders")({
  component: FoundersPage,
});
