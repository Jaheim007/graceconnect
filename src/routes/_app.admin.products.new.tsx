import { createFileRoute } from "@tanstack/react-router";
import { ProductForm as AdminProductForm } from "@/pages/admin/AdminProductForm";

export const Route = createFileRoute("/_app/admin/products/new")({
  component: AdminProductForm,
});
