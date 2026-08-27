import { createFileRoute } from "@tanstack/react-router";
import { AdminAffiliation as LazyAdminAffiliation } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/affiliation")({
  component: LazyAdminAffiliation,
});
