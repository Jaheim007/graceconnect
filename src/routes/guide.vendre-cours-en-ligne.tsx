import { createFileRoute } from "@tanstack/react-router";
import GuideVendreCoursPage from "@/pages/guides/GuideVendreCoursPage";

export const Route = createFileRoute("/guide/vendre-cours-en-ligne")({
  component: GuideVendreCoursPage,
});
