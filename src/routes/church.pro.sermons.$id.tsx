import { createFileRoute } from "@tanstack/react-router";
import { IdRedirect } from "@/routes/-redirect-helpers";

export const Route = createFileRoute("/church/pro/sermons/$id")({
  component: () => (
    <IdRedirect toBase="/admin/church/sermons" />
  ),
});
