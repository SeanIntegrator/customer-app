import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cancelCustomerOrder } from '../lib/api';

export default function CancellationModal({ open, onClose, authFetch, order, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!order?.id || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cancelCustomerOrder(authFetch, order.id);
      onCancelled?.(data, order.id);
      handleClose();
    } catch (e) {
      setError(e.message || 'Could not cancel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPence = order?.total_amount ?? 0;

  return (
    <AnimatePresence>
      {open && order && (
        <>
          <motion.div
            key="cancel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 180,
              background: 'rgba(8,16,8,0.82)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <motion.div
            key="cancel-sheet"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: 18,
              right: 18,
              top: 'max(12vh, 80px)',
              zIndex: 190,
              maxWidth: 420,
              margin: '0 auto',
              borderRadius: 24,
              overflow: 'hidden',
              background: '#faf5eb',
              boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid rgba(26,46,26,0.08)' }}>
              <h2
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#1a2e1a',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Cancel this order?
              </h2>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 14,
                  color: 'rgba(26,46,26,0.55)',
                  margin: '10px 0 0',
                  lineHeight: 1.45,
                }}
              >
                We will refund your card for the full order total. Refunds usually appear in 5–10 business days.
              </p>
            </div>
            <div style={{ padding: '16px 22px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(26,46,26,0.4)',
                  }}
                >
                  Refund amount
                </span>
                <span
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#1a2e1a',
                  }}
                >
                  £{(totalPence / 100).toFixed(2)}
                </span>
              </div>
              {error && (
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 13,
                    color: '#b34a2a',
                    margin: '0 0 12px',
                  }}
                >
                  {error}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirm}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: 18,
                    border: 'none',
                    background: loading ? 'rgba(179,74,42,0.5)' : '#b34a2a',
                    color: '#faf5eb',
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 17,
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Cancelling…' : 'Yes, cancel and refund'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 18,
                    border: '1.5px solid rgba(26,46,26,0.2)',
                    background: 'transparent',
                    color: '#1a2e1a',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Keep my order
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
