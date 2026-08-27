import { createFileRoute } from "@tanstack/react-router";
import ChurchProGiving from "@/pages/church/ChurchProGiving";

export const Route = createFileRoute("/_app/admin/church/giving")({
  component: ChurchProGiving,
});
