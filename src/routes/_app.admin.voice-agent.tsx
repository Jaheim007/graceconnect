import { createFileRoute } from "@tanstack/react-router";
import VoiceAgentPage from "@/pages/labs/VoiceAgentPage";

export const Route = createFileRoute("/_app/admin/voice-agent")({
  component: VoiceAgentPage,
});
