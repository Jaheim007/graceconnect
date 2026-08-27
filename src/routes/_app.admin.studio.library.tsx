import { createFileRoute } from "@tanstack/react-router";
import AssetsLibrary from "@/pages/admin/studio/AssetsLibrary";

export const Route = createFileRoute("/_app/admin/studio/library")({
  component: AssetsLibrary,
});
