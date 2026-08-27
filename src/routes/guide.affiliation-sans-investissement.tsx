import { createFileRoute } from "@tanstack/react-router";
import GuideAffiliationSansInvestissementPage from "@/pages/guides/GuideAffiliationSansInvestissementPage";

export const Route = createFileRoute("/guide/affiliation-sans-investissement")({
  component: GuideAffiliationSansInvestissementPage,
});
