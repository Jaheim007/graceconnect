import { createFileRoute } from "@tanstack/react-router";
import { ProductForm as AdminProductForm } from "@/pages/admin/AdminProductForm";

export const Route = createFileRoute("/_app/admin/products/$id/edit")({
  component: AdminProductForm,
});
