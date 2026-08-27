import { createFileRoute } from "@tanstack/react-router";
import CookiePolicyPage from "@/pages/CookiePolicyPage";

export const Route = createFileRoute("/cookies")({
  component: CookiePolicyPage,
});
