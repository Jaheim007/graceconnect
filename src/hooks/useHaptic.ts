import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [30],
  heavy: [50],
  success: [10, 30, 10],
  error: [50, 50, 50],
};

/**
 * Hook for haptic (vibration) feedback on mobile devices.
 * Falls back silently on unsupported browsers/devices.
 */
export function useHaptic() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrate = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported) return;
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      // silent
    }
  }, [isSupported]);

  return { isSupported, vibrate };
}
