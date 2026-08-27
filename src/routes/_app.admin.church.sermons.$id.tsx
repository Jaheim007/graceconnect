import { createFileRoute } from "@tanstack/react-router";
import ChurchProSermonDetail from "@/pages/church/ChurchProSermonDetail";

export const Route = createFileRoute("/_app/admin/church/sermons/$id")({
  component: ChurchProSermonDetail,
});
