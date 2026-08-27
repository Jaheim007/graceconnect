import { createFileRoute } from "@tanstack/react-router";
import ChurchSermonPdfSuccessPage from "@/pages/church/ChurchSermonPdfSuccessPage";

export const Route = createFileRoute("/church/$slug/pdf/$pdfId/success")({
  component: ChurchSermonPdfSuccessPage,
});
