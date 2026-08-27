import { createFileRoute } from "@tanstack/react-router";
import PourBloggeursPage from "@/pages/persona/PourBloggeursPage";

export const Route = createFileRoute("/pour/blogueurs")({
  component: PourBloggeursPage,
});
