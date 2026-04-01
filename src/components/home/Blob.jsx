import { motion } from 'framer-motion';

export default function Blob({ style }) {
  return (
    <motion.div
      style={{ position: 'absolute', borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%', ...style }}
      animate={{
        borderRadius: [
          '60% 40% 55% 45% / 50% 60% 40% 50%',
          '45% 55% 40% 60% / 60% 45% 55% 40%',
          '60% 40% 55% 45% / 50% 60% 40% 50%',
        ],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
