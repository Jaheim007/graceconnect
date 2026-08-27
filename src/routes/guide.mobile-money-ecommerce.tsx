import { createFileRoute } from "@tanstack/react-router";
import GuideMobileMoneyPage from "@/pages/guides/GuideMobileMoneyPage";

export const Route = createFileRoute("/guide/mobile-money-ecommerce")({
  component: GuideMobileMoneyPage,
});
