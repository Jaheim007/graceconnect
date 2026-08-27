import { createFileRoute } from "@tanstack/react-router";
import InstallPage from "@/pages/InstallPage";

export const Route = createFileRoute("/install")({
  component: InstallPage,
});
