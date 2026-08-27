import { createFileRoute } from "@tanstack/react-router";
import ChurchProSectionStub from "@/pages/church/ChurchProSectionStub";

export const Route = createFileRoute("/_app/admin/church/members")({
  component: () => (
    <ChurchProSectionStub titleFr="Membres & diaspora" titleEn="Members & diaspora" phase="Phase 5" />
  ),
});
