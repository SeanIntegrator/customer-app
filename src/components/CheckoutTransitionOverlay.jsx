import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GREEN = '#1a2e1a';
const CREAM = '#f0e6d0';

/**
 * Full-screen handoff before redirecting to Stripe Hosted Checkout.
 */
export default function CheckoutTransitionOverlay({ open }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-busy="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8,16,8,0.92)',
            backdropFilter: 'blur(10px)',
            padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{
              background: CREAM,
              borderRadius: 24,
              padding: '32px 36px',
              maxWidth: 320,
              textAlign: 'center',
              boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
            }}
          >
            <div
              className="animate-spin"
              style={{
                width: 40,
                height: 40,
                margin: '0 auto 20px',
                border: `3px solid rgba(26,46,26,0.15)`,
                borderTopColor: GREEN,
                borderRadius: '50%',
              }}
            />
            <p
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 22,
                fontWeight: 800,
                color: GREEN,
                margin: '0 0 8px',
                letterSpacing: '-0.03em',
              }}
            >
              Taking you to checkout
            </p>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 14,
                color: 'rgba(26,46,26,0.55)',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Secure payment with Stripe — you’ll return here when you’re done.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
