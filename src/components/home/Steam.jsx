import { motion } from 'framer-motion';

export default function Steam() {
  const wisps = [
    { x: 7, delay: 0 },
    { x: 15, delay: 0.45 },
    { x: 23, delay: 0.2 },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 36,
        height: 28,
        pointerEvents: 'none',
      }}
    >
      {wisps.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            bottom: 0,
            width: 2.5,
            height: 18,
            background: 'linear-gradient(to top, rgba(255,255,255,0.65), transparent)',
            borderRadius: 8,
          }}
          animate={{ opacity: [0, 0.85, 0], y: [6, -8, -18], scaleX: [1, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
