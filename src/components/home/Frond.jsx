import { motion } from 'framer-motion';

export default function Frond({ x = 0, y = 0, size = 44, rotate = 0, delay = 0, opacity = 0.22 }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: x, top: y, rotate, originX: '50%', originY: '100%' }}
      animate={{ rotate: [rotate - 6, rotate + 6, rotate - 6] }}
      transition={{ duration: 5 + delay * 0.8, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <svg width={size} height={size * 2.4} viewBox="0 0 50 120" fill="none" style={{ opacity }}>
        <path
          d="M25 118 C25 100 25 15 25 4"
          stroke="#6aaa6a"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {[22, 40, 58, 76, 94].map((cy, i) => {
          const w = 22 - i * 2;
          return (
            <g key={i}>
              <path
                d={`M25 ${cy} C${25 - w} ${cy - 10} ${25 - w - 8} ${cy} ${25 - w - 2} ${cy + 10} C${25 - 6} ${cy + 14} ${25 - 3} ${cy + 5} 25 ${cy}`}
                fill="#4a8a4a"
                opacity={0.75 - i * 0.09}
              />
              <path
                d={`M25 ${cy} C${25 + w} ${cy - 10} ${25 + w + 8} ${cy} ${25 + w + 2} ${cy + 10} C${25 + 6} ${cy + 14} ${25 + 3} ${cy + 5} 25 ${cy}`}
                fill="#4a8a4a"
                opacity={0.68 - i * 0.09}
              />
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}
