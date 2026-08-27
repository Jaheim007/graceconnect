import { createFileRoute } from "@tanstack/react-router";
import { ShortcutRedirect } from "@/components/layout/ShortcutRedirect";

export const Route = createFileRoute("/_app/settings")({
  component: () => (
    <ShortcutRedirect kind="settings" />
  ),
});
