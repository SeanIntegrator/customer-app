import { motion } from 'framer-motion';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../../lib/checkoutTheme';
import { checkoutFabWrap, checkoutFabInner } from '../../styles/orderShellUi';

function fabLabel(addingToOrderId, editOrderId) {
  if (addingToOrderId != null) return 'Add-ons';
  if (editOrderId != null) return 'Update order';
  return 'View order';
}

export default function OrderShellCheckoutFab({
  totalItems,
  subtotalPence,
  cartBounce,
  addingToOrderId,
  editOrderId,
  onOpenCart,
}) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      style={checkoutFabWrap}
    >
      <div style={checkoutFabInner}>
        <motion.button
        type="button"
        animate={cartBounce ? { scale: [1, 1.05, 0.98, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        onClick={onOpenCart}
        style={{
          width: '100%',
          background: CHECKOUT_PRIMARY_GRADIENT,
          color: CHECKOUT_PRIMARY_TEXT,
          borderRadius: 22,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          cursor: 'pointer',
          boxShadow: cartBounce ? '0 4px 24px rgba(200,144,42,0.5)' : CHECKOUT_PRIMARY_SHADOW,
          fontFamily: 'Fraunces, Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              background: 'rgba(18,32,18,0.18)',
              color: '#122012',
              fontSize: 11,
              fontWeight: 800,
              width: 22,
              height: 22,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {totalItems}
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {fabLabel(addingToOrderId, editOrderId)}
          </span>
        </div>
        <span
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 700 }}
        >
          £{(subtotalPence / 100).toFixed(2)}
        </span>
      </motion.button>
      </div>
    </motion.div>
  );
}
