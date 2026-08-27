import { createFileRoute } from "@tanstack/react-router";
import GuideGagnerSansContenuPage from "@/pages/guides/GuideGagnerSansContenuPage";

export const Route = createFileRoute("/guide/gagner-sans-contenu")({
  component: GuideGagnerSansContenuPage,
});
