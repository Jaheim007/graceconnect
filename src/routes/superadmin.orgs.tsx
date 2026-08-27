import { createFileRoute } from "@tanstack/react-router";
import { SuperadminOrgs as LazySuperadminOrgs } from "@/pages/superadmin/SuperadminPages";

export const Route = createFileRoute("/superadmin/orgs")({
  component: LazySuperadminOrgs,
});
