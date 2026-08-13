import { useReducedMotion } from 'framer-motion';

/**
 * Calm, always-moving aurora backdrop for the landing hero.
 * GPU-only transforms, disabled when the user prefers reduced motion,
 * lighter on mobile to protect battery.
 */
export function HeroAurora() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(70% 50% at 50% 0%, hsl(var(--primary)/0.08), transparent 60%)',
        }}
      />
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft gradient blobs */}
      <div
        className="absolute -top-[20%] left-1/4 h-[60%] w-[60%] rounded-full opacity-60 blur-3xl will-change-transform dark:opacity-40"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)/0.28), transparent 70%)',
          animation: 'aurora-drift-1 38s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[10%] -right-[10%] h-[50%] w-[50%] rounded-full opacity-50 blur-3xl will-change-transform dark:opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)/0.22), transparent 70%)',
          animation: 'aurora-drift-2 32s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -bottom-[10%] left-[10%] h-[45%] w-[45%] rounded-full opacity-40 blur-3xl will-change-transform dark:opacity-25"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)/0.18), transparent 70%)',
          animation: 'aurora-drift-3 45s ease-in-out infinite',
        }}
      />

      {/* Faint dot grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <style>{`
        @keyframes aurora-drift-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(8%, 6%, 0) scale(1.08); }
        }
        @keyframes aurora-drift-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-10%, 4%, 0) scale(1.05); }
        }
        @keyframes aurora-drift-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(6%, -8%, 0) scale(1.12); }
        }

        @media (prefers-reduced-motion: reduce) {
          .will-change-transform { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
