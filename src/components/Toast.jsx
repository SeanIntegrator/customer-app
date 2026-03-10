import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, type = 'success', visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={`fixed bottom-24 left-1/2 z-50 px-4 py-2.5 rounded-full text-sm font-sans font-semibold shadow-warm-lg whitespace-nowrap ${
            type === 'error'
              ? 'bg-terracotta text-cream'
              : 'bg-bark text-cream'
          }`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
