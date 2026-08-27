import { createFileRoute } from "@tanstack/react-router";
import GoRedirectPage from "@/pages/GoRedirectPage";

export const Route = createFileRoute("/go/$code")({
  component: GoRedirectPage,
});
