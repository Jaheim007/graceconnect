import { createFileRoute } from "@tanstack/react-router";
import SuperadminAiPolicies from "@/pages/superadmin/studio/AiPoliciesManager";

export const Route = createFileRoute("/superadmin/studio/policies")({
  component: SuperadminAiPolicies,
});
