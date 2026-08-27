import { createFileRoute } from "@tanstack/react-router";
import AdminSales from "@/pages/admin/AdminSales";

export const Route = createFileRoute("/_app/admin/sales")({
  component: AdminSales,
});
