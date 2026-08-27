import { createFileRoute } from "@tanstack/react-router";
import SuperadminAIHistory from "@/pages/superadmin/SuperadminAIHistory";

export const Route = createFileRoute("/superadmin/ai-history")({
  component: SuperadminAIHistory,
});
