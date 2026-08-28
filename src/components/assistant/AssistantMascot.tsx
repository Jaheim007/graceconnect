import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MascotProps {
  className?: string;
  /** Adds the idle bob + blink loop. Disable for static avatars. */
  animated?: boolean;
  /** Mouth becomes a talking wave while the assistant is thinking. */
  talking?: boolean;
}

/**
 * SiteViral assistant mascot — navy body, gold eyes/antenna.
 * Pure SVG (no asset request), colour-safe in light & dark mode:
 * the shell uses `currentColor`, accents use the brand gold.
 */
export function AssistantMascot({ className, animated = true, talking = false }: MascotProps) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      className={cn('relative', className)}
      fill="none"
      aria-hidden
      animate={animated ? { y: [0, -1.6, 0] } : undefined}
      transition={animated ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {/* antenna — gentle pulse so the bot reads as "alive" */}
      <path d="M16 4.5v2.6" stroke="#F5C136" strokeWidth="1.8" strokeLinecap="round" />
      <motion.circle
        cx="16"
        cy="3.4"
        r="1.6"
        fill="#F5C136"
        animate={animated ? { opacity: [1, 0.45, 1], r: [1.6, 2, 1.6] } : undefined}
        transition={animated ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />

      {/* head */}
      <rect
        x="5.5"
        y="7.5"
        width="21"
        height="16"
        rx="6.5"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      {/* eyes — blink loop */}
      <motion.g
        animate={animated ? { scaleY: [1, 1, 0.12, 1] } : undefined}
        transition={animated ? { duration: 4.4, repeat: Infinity, times: [0, 0.86, 0.92, 1], ease: 'easeInOut' } : undefined}
        style={{ transformOrigin: '16px 15px' }}
      >
        <circle cx="12" cy="15" r="2.1" fill="#F5C136" />
        <circle cx="20" cy="15" r="2.1" fill="#F5C136" />
      </motion.g>

      {/* mouth — smile at rest, talking wave while thinking */}
      {talking ? (
        <motion.path
          d="M12.6 19.6h6.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          animate={{ d: ['M12.6 19.6h6.8', 'M12.8 19.3c1.9 1.5 4.5 1.5 6.4 0', 'M12.6 19.6h6.8'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <path d="M12.8 19.4c1.9 1.3 4.5 1.3 6.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}

      {/* ears */}
      <path d="M3.6 13.4v4.2M28.4 13.4v4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </motion.svg>
  );
}
