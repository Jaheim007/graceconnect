import { createFileRoute } from "@tanstack/react-router";
import { AdminProducts as LazyAdminProducts } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/products/")({
  component: LazyAdminProducts,
});
