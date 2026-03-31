import { motion } from 'framer-motion';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

function formatGbp(pence) {
  const n = Number(pence) || 0;
  return `£${(n / 100).toFixed(2)}`;
}

/** Stroke “X” icon (line art), not the filled modal close glyph */
function XIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Full-bleed success panel inside the cart-style bottom sheet (matches {@link OrderSuccess}).
 */
export default function OrderCancelledSuccess({ refundedAmountPence, onDone }) {
  const amountLabel = formatGbp(refundedAmountPence);

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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />

      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={onDone}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(240,230,208,0.12)',
          border: '1.5px solid rgba(240,230,208,0.28)',
          color: '#f0e6d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <XIcon size={22} />
      </motion.button>

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
        <motion.div
          initial={{ opacity: 0, rotate: -45 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          style={{ color: '#c8902a' }}
        >
          <XIcon size={44} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ position: 'relative', maxWidth: 320 }}
      >
        <h2
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 26,
            fontWeight: 900,
            color: '#f0e6d0',
            letterSpacing: '-0.03em',
            margin: '0 0 12px',
            lineHeight: 1.15,
          }}
        >
          Your order has been cancelled
        </h2>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 14,
            color: 'rgba(240,230,208,0.72)',
            margin: '0 0 28px',
            lineHeight: 1.55,
          }}
        >
          Your refund of <strong style={{ color: '#f0e6d0', fontWeight: 700 }}>{amountLabel}</strong> is being
          processed. You&apos;ll receive it in a few days.
        </p>

        <motion.button
          type="button"
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
