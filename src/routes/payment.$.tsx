import { createFileRoute } from "@tanstack/react-router";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import { Navigate } from "@/lib/router-compat";

// /payment/success is a load-bearing external-redirect URL (payment providers).
// It collides with /payment-success in the generated route tree when declared
// as payment.success.tsx, so it is served from this splat instead.
export const Route = createFileRoute("/payment/$")({
  component: PaymentCatchAll,
});

function PaymentCatchAll() {
  const { _splat } = Route.useParams();
  if (_splat === "success") return <PaymentSuccessPage />;
  return <Navigate to="/payment-success" replace />;
}
