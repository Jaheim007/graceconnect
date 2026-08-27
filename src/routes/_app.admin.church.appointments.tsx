import { createFileRoute } from "@tanstack/react-router";
import ChurchProAppointments from "@/pages/church/ChurchProAppointments";

export const Route = createFileRoute("/_app/admin/church/appointments")({
  component: ChurchProAppointments,
});
