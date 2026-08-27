import { createFileRoute } from "@tanstack/react-router";
import PourDesignersPage from "@/pages/persona/PourDesignersPage";

export const Route = createFileRoute("/pour/designers")({
  component: PourDesignersPage,
});
