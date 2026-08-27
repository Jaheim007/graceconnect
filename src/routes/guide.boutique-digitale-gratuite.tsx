import { createFileRoute } from "@tanstack/react-router";
import GuideBoutiqueDigitalePage from "@/pages/guides/GuideBoutiqueDigitalePage";

export const Route = createFileRoute("/guide/boutique-digitale-gratuite")({
  component: GuideBoutiqueDigitalePage,
});
