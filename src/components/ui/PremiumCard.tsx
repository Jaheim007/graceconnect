import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

type PremiumCardVariant = 'default' | 'glass' | 'gradient' | 'glow' | 'stat';

interface PremiumCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: PremiumCardVariant;
  /** Glow color: 'primary' | 'accent' | 'emerald' */
  glow?: 'primary' | 'accent' | 'emerald';
  /** Animate on mount */
  animate?: boolean;
  /** Delay for staggered animations */
  delay?: number;
  noPadding?: boolean;
}

const variantClasses: Record<PremiumCardVariant, string> = {
  default: 'bg-card border border-border shadow-card',
  glass: 'glass-premium border border-border/60 shadow-elevated',
  gradient: 'premium-gradient border border-border shadow-card',
  glow: 'bg-card border border-border shadow-premium',
  stat: 'stat-gradient border border-border shadow-card hover:shadow-elevated transition-shadow',
};

const glowClasses: Record<string, string> = {
  primary: 'glow-primary',
  accent: 'glow-accent',
  emerald: 'glow-emerald',
};

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ variant = 'default', glow, animate = true, delay = 0, noPadding, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={animate ? { opacity: 0, y: 12 } : false}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={animate ? { delay, type: 'spring', stiffness: 300, damping: 28 } : undefined}
        className={cn(
          'rounded-2xl',
          variantClasses[variant],
          glow && glowClasses[glow],
          !noPadding && 'p-5',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';
