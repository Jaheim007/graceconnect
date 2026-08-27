import { createFileRoute } from "@tanstack/react-router";
import MyReviewsPage from "@/pages/MyReviewsPage";

export const Route = createFileRoute("/_app/my-reviews")({
  component: MyReviewsPage,
});
