import { createFileRoute } from "@tanstack/react-router";
import SuperadminAIChat from "@/pages/superadmin/SuperadminAIChat";

export const Route = createFileRoute("/superadmin/ai")({
  component: SuperadminAIChat,
});
