import { createFileRoute } from "@tanstack/react-router";
import GuideAlternativeGofundmePage from "@/pages/guides/GuideAlternativeGofundmePage";

export const Route = createFileRoute("/guide/alternative-gofundme")({
  component: GuideAlternativeGofundmePage,
});
