import { createFileRoute } from "@tanstack/react-router";
import AdminPromoCodes from "@/pages/admin/AdminPromoCodes";

export const Route = createFileRoute("/_app/admin/promo-codes")({
  component: AdminPromoCodes,
});
