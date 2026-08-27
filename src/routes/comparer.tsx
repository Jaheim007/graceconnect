import { createFileRoute } from "@tanstack/react-router";
import ComparerPage from "@/pages/ComparerPage";

export const Route = createFileRoute("/comparer")({
  component: ComparerPage,
});
