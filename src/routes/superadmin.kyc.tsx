import { createFileRoute } from "@tanstack/react-router";
import { SuperadminKYC as LazySuperadminKYC } from "@/pages/superadmin/SuperadminPages";

export const Route = createFileRoute("/superadmin/kyc")({
  component: LazySuperadminKYC,
});
