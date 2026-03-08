import { motion } from 'framer-motion';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

/**
 * Text with animated shifting gradient — eye-catching for hero headlines.
 */
export function GradientText({ children, className = '', animate = true }: GradientTextProps) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent bg-[length:200%_auto] bg-gradient-to-r from-primary via-accent to-primary ${className}`}
      animate={animate ? { backgroundPosition: ['0% center', '200% center'] } : undefined}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  );
}
