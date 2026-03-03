import { type ReactNode } from 'react';
import { useMode, type AppMode } from '@/contexts/ModeContext';

interface UniverseGateProps {
  /** Which universe(s) this component is allowed to render in */
  universe: AppMode | AppMode[];
  children: ReactNode;
  /** Optional fallback when universe doesn't match (defaults to null) */
  fallback?: ReactNode;
}

/**
 * UniverseGate — UI Contamination Prevention
 * 
 * Renders children ONLY if the current mode matches the allowed universe(s).
 * Prevents ambassador elements from leaking into creator view and vice versa.
 * 
 * Usage:
 *   <UniverseGate universe="ambassador">
 *     <CommissionBadge />
 *   </UniverseGate>
 * 
 *   <UniverseGate universe={['public', 'ambassador']}>
 *     <ShareWidget />
 *   </UniverseGate>
 */
export function UniverseGate({ universe, children, fallback = null }: UniverseGateProps) {
  const { mode } = useMode();
  const allowed = Array.isArray(universe) ? universe : [universe];

  if (!allowed.includes(mode)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
