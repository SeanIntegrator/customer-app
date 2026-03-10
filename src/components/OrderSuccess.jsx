import { motion } from 'framer-motion';

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

export default function OrderSuccess({ onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
        padding: '32px 24px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Grain overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRAIN,
        backgroundRepeat: 'repeat',
        pointerEvents: 'none',
      }} />

      {/* Check circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(200,144,42,0.12)',
          border: '2.5px solid rgba(200,144,42,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          position: 'relative',
        }}
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c8902a"
          strokeWidth="2.5"
          style={{ width: 44, height: 44 }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ position: 'relative' }}
      >
        <h2 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 36,
          fontWeight: 900,
          color: '#f0e6d0',
          letterSpacing: '-0.03em',
          marginBottom: 8,
          margin: '0 0 8px',
        }}>
          Order placed!
        </h2>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 14,
          color: 'rgba(240,230,208,0.6)',
          marginBottom: 4,
          margin: '0 0 4px',
          lineHeight: 1.5,
        }}>
          Your order is with the baristas.
        </p>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: '#c8902a',
          marginBottom: 28,
          margin: '0 0 28px',
        }}>
          ☕ Ready in approximately 15 minutes
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDone}
          style={{
            background: '#f0e6d0',
            color: '#1a2e1a',
            borderRadius: 20,
            padding: '14px 32px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          Back to home
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
