import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  rating: number;
  onRate?: (r: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function AnimatedStarRating({ rating, onRate, interactive = false, size = 'md' }: Props) {
  const [hover, setHover] = useState(0);
  const active = hover || rating;
  const px = sizeMap[size];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = active >= i;
        const halfFilled = !filled && active >= i - 0.5;

        return (
          <motion.button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              'relative outline-none transition-colors',
              interactive && 'cursor-pointer'
            )}
            onMouseEnter={() => interactive && setHover(i)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => onRate?.(i)}
            whileHover={interactive ? { scale: 1.25, rotate: -12 } : {}}
            whileTap={interactive ? { scale: 0.85, rotate: 12 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {/* Background star */}
            <Star className={cn(px, 'text-muted-foreground/20')} />

            {/* Filled overlay with pop animation */}
            <AnimatePresence>
              {filled && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Star className={cn(px, 'fill-[hsl(var(--accent))] text-[hsl(var(--accent))]')} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sparkle burst on selection */}
            <AnimatePresence>
              {interactive && filled && hover === i && (
                <>
                  {[0, 60, 120, 180, 240, 300].map(deg => (
                    <motion.span
                      key={deg}
                      className="absolute top-1/2 left-1/2 h-1 w-1 rounded-full bg-[hsl(var(--accent))]"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{
                        x: Math.cos((deg * Math.PI) / 180) * 14,
                        y: Math.sin((deg * Math.PI) / 180) * 14,
                        opacity: 0,
                        scale: 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
