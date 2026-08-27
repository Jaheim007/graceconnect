import { createFileRoute } from "@tanstack/react-router";
import AdminPeople from "@/pages/admin/AdminPeople";

export const Route = createFileRoute("/_app/admin/people")({
  component: AdminPeople,
});
