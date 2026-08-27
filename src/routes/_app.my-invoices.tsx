import { createFileRoute } from "@tanstack/react-router";
import MyInvoicesPage from "@/pages/MyInvoicesPage";

export const Route = createFileRoute("/_app/my-invoices")({
  component: MyInvoicesPage,
});
