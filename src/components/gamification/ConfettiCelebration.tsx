import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PARTICLE_COUNT = 60;
const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: 'circle' | 'square' | 'star';
}

interface ConfettiCelebrationProps {
  active: boolean;
  onDone?: () => void;
  message?: string;
  emoji?: string;
}

export function ConfettiCelebration({ active, onDone, message, emoji = '🎉' }: ConfettiCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showMessage, setShowMessage] = useState(false);

  const generateParticles = useCallback(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      velocityX: (Math.random() - 0.5) * 80,
      velocityY: -40 - Math.random() * 60,
      shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
    }));
  }, []);

  useEffect(() => {
    if (!active) return;
    setParticles(generateParticles());
    setShowMessage(true);
    const timer = setTimeout(() => {
      setParticles([]);
      setShowMessage(false);
      onDone?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [active, generateParticles, onDone]);

  if (!active && particles.length === 0 && !showMessage) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* Confetti particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 1, scale: 1 }}
          animate={{
            x: `${p.x + p.velocityX}vw`,
            y: `${p.y + 120}vh`,
            rotate: p.rotation + 720,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 2.5 + Math.random(), ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'star' ? '2px' : '1px',
          }}
        />
      ))}

      {/* Celebration message */}
      <AnimatePresence>
        {showMessage && message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-3xl px-8 py-6 shadow-elevated text-center max-w-sm pointer-events-auto">
              <span className="text-5xl block mb-3">{emoji}</span>
              <p className="text-lg font-bold text-foreground">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
