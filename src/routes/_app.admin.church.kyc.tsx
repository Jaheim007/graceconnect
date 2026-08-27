import { createFileRoute } from "@tanstack/react-router";
import ChurchKYCPage from "@/pages/church/ChurchKYCPage";

export const Route = createFileRoute("/_app/admin/church/kyc")({
  component: ChurchKYCPage,
});
