import { createFileRoute } from "@tanstack/react-router";
import LazySuperadminTransactions from "@/pages/superadmin/SuperadminTransactions";

export const Route = createFileRoute("/superadmin/transactions")({
  component: LazySuperadminTransactions,
});
