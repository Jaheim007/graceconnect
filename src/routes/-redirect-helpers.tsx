/**
 * Redirect helper components ported from the old src/App.tsx.
 * The leading dash keeps this file out of TanStack's route tree.
 */
import { Navigate, useParams } from "@/lib/router-compat";

/** Redirect /store/:slug → /org/:slug/store */
export function StoreRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/org/${slug}/store`} replace />;
}

export function IdRedirect({ toBase }: { toBase: string }) {
  const { id } = useParams();
  return <Navigate to={id ? `${toBase}/${id}` : toBase} replace />;
}