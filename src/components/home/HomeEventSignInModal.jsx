import { motion, AnimatePresence } from 'framer-motion';
import SignInButton from '../SignInButton';

export default function HomeEventSignInModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 210,
            background: 'rgba(8,16,8,0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#f0e6d0',
              borderRadius: 24,
              padding: 28,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
              border: '1.5px solid #d4c0a0',
            }}
          >
            <h3
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 22,
                fontWeight: 800,
                color: '#1a2e1a',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Sign in to join events
            </h3>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                color: 'rgba(26,46,26,0.55)',
                margin: '0 0 20px',
                lineHeight: 1.45,
              }}
            >
              Book a spot with your Google account — it only takes a moment.
            </p>
            <SignInButton style={{ marginBottom: 16 }} />
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                background: 'rgba(26,46,26,0.06)',
                border: '1.5px solid #d4c0a0',
                borderRadius: 14,
                padding: '12px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(26,46,26,0.55)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
