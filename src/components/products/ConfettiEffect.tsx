import { motion } from 'framer-motion';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFA07A', '#DDA0DD', '#FFD700', '#87CEEB'];

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: -10,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: [0, 300 + Math.random() * 200],
        x: [0, (Math.random() - 0.5) * 120],
        opacity: [1, 1, 0],
        rotate: rotation + Math.random() * 720,
      }}
      transition={{
        duration: 2 + Math.random(),
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export function ConfettiEffect({ count = 40 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {Array.from({ length: count }).map((_, i) => (
        <ConfettiParticle key={i} delay={i * 0.05} x={Math.random() * 100} />
      ))}
    </div>
  );
}
