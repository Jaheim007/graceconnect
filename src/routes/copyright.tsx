import { createFileRoute } from "@tanstack/react-router";
import CopyrightPage from "@/pages/CopyrightPage";

export const Route = createFileRoute("/copyright")({
  component: CopyrightPage,
});
