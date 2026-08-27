import { createFileRoute } from "@tanstack/react-router";
import ChangelogPage from "@/pages/ChangelogPage";

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
});
