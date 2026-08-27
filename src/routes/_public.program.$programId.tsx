import { createFileRoute } from "@tanstack/react-router";
import ProgramDetailPage from "@/pages/ProgramDetailPage";

export const Route = createFileRoute("/_public/program/$programId")({
  component: ProgramDetailPage,
});
