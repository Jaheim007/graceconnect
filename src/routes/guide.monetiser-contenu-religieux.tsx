import { createFileRoute } from "@tanstack/react-router";
import GuideMonetiserContenuReligieuxPage from "@/pages/guides/GuideMonetiserContenuReligieuxPage";

export const Route = createFileRoute("/guide/monetiser-contenu-religieux")({
  component: GuideMonetiserContenuReligieuxPage,
});
