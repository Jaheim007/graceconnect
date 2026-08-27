import { createFileRoute } from "@tanstack/react-router";
import CourseCatalogPage from "@/pages/CourseCatalogPage";

export const Route = createFileRoute("/_public/courses")({
  component: CourseCatalogPage,
});
