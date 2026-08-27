import { createFileRoute } from "@tanstack/react-router";
import ChurchSermonPdfBuyPage from "@/pages/church/ChurchSermonPdfBuyPage";

export const Route = createFileRoute("/church/$slug/pdf/$pdfId/")({
  component: ChurchSermonPdfBuyPage,
});
