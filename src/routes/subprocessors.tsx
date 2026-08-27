import { createFileRoute } from "@tanstack/react-router";
import SubprocessorsPage from "@/pages/SubprocessorsPage";

export const Route = createFileRoute("/subprocessors")({
  component: SubprocessorsPage,
});
