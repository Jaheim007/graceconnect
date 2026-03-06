import { type ReactNode } from 'react';

interface UniverseGateProps {
  universe: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * UniverseGate — Legacy wrapper, now always renders children.
 * Kept for backward compatibility. The unified dashboard approach
 * means all features are always visible to logged-in users.
 */
export function UniverseGate({ children }: UniverseGateProps) {
  return <>{children}</>;
}
