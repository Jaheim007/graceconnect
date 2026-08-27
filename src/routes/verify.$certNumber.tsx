import { createFileRoute } from "@tanstack/react-router";
import CertificateVerifyPage from "@/pages/CertificateVerifyPage";

export const Route = createFileRoute("/verify/$certNumber")({
  component: CertificateVerifyPage,
});
