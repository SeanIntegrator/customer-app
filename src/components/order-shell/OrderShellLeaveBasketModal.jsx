import { motion } from 'framer-motion';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../../lib/checkoutTheme';

export default function OrderShellLeaveBasketModal({ onStay, onLeaveAndClear }) {
  return (
    <motion.div
      key="leave-basket-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[280] flex items-start justify-center pt-[22vh] px-4"
      style={{ background: 'rgba(8,16,8,0.78)' }}
      onClick={onStay}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ background: '#faf5eb', border: '1.5px solid rgba(26,46,26,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 20,
            fontWeight: 800,
            color: '#1a2e1a',
            margin: '0 0 12px',
          }}
        >
          Leave the menu?
        </h3>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 14,
            color: 'rgba(26,46,26,0.6)',
            margin: '0 0 20px',
            lineHeight: 1.45,
          }}
        >
          Leaving this page will clear your edits to your basket.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={onStay}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 16,
              border: 'none',
              background: CHECKOUT_PRIMARY_GRADIENT,
              color: CHECKOUT_PRIMARY_TEXT,
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 17,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: CHECKOUT_PRIMARY_SHADOW,
            }}
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onLeaveAndClear}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 16,
              border: '1.5px solid rgba(26,46,26,0.2)',
              background: 'transparent',
              color: '#1a2e1a',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Leave and clear edits
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
