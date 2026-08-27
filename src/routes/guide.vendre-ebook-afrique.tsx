import { createFileRoute } from "@tanstack/react-router";
import GuideVendreEbookPage from "@/pages/guides/GuideVendreEbookPage";

export const Route = createFileRoute("/guide/vendre-ebook-afrique")({
  component: GuideVendreEbookPage,
});
