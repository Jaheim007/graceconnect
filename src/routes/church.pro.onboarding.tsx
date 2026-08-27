import { createFileRoute } from "@tanstack/react-router";
import ChurchOnboarding from "@/pages/church/ChurchOnboarding";

export const Route = createFileRoute("/church/pro/onboarding")({
  component: ChurchOnboarding,
});
