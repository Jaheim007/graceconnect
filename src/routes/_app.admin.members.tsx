import { createFileRoute } from "@tanstack/react-router";
import { AdminMembers as LazyAdminMembers } from "@/pages/admin/AdminPages";

export const Route = createFileRoute("/_app/admin/members")({
  component: LazyAdminMembers,
});
