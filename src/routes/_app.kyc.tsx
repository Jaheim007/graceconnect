import { createFileRoute } from "@tanstack/react-router";
import { ShortcutRedirect } from "@/components/layout/ShortcutRedirect";

export const Route = createFileRoute("/_app/kyc")({
  component: () => (
    <ShortcutRedirect kind="kyc" />
  ),
});
