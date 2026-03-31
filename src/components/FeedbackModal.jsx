import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitOrderFeedback, fetchCustomerOrder } from '../lib/api';
import { previewStampsEarnedForOrderTotal } from '../lib/loyaltyStampPreview';

const CREAM = '#f0e6d0';
const GREEN = '#1a2e1a';
const GOLD = '#c8902a';

function StarRow({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onClick={() => onChange(n)}
            style={{
              width: 48,
              height: 48,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              fontSize: 40,
              color: filled ? GOLD : 'rgba(26,46,26,0.22)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string | number} props.orderId
 * @param {typeof fetch} props.fetchImpl
 * @param {() => void} props.onClose
 * @param {(result: { rating: number, shouldShowGooglePrompt: boolean, googleReviewUrl: string }) => void} props.onComplete
 */
export default function FeedbackModal({ isOpen, orderId, fetchImpl, onClose, onComplete }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState('');
  const [earnedStamps, setEarnedStamps] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setRating(null);
      setComment('');
      setSubmitting(false);
      setHint('');
      setEarnedStamps(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || orderId === '' || orderId == null) {
      setEarnedStamps(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const o = await fetchCustomerOrder(fetchImpl, orderId);
        if (cancelled) return;
        const { stamps } = previewStampsEarnedForOrderTotal(o.total_amount);
        setEarnedStamps(stamps);
      } catch {
        if (!cancelled) setEarnedStamps(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, orderId, fetchImpl]);

  useEffect(() => {
    if (rating != null) setHint('');
  }, [rating]);

  const handleClose = () => {
    onClose();
  };

  const handleShare = async () => {
    if (rating == null) {
      setHint('Please tap a star rating first.');
      return;
    }
    setHint('');
    setSubmitting(true);
    try {
      const result = await submitOrderFeedback(fetchImpl, {
        order_id: orderId,
        rating,
        comment: comment.trim(),
      });
      onComplete({
        rating,
        shouldShowGooglePrompt: result.shouldShowGooglePrompt,
        googleReviewUrl: result.googleReviewUrl,
      });
    } catch (e) {
      setHint(e.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            pointerEvents: 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8,16,8,0.82)',
              backdropFilter: 'blur(8px)',
            }}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              borderRadius: '24px 24px 0 0',
              background: CREAM,
              boxShadow: '0 -8px 48px rgba(0,0,0,0.35)',
              padding: '20px 22px calc(28px + env(safe-area-inset-bottom, 0px))',
              maxHeight: '88vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(26,46,26,0.15)',
                  background: 'rgba(255,255,255,0.35)',
                  color: GREEN,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {earnedStamps != null ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: earnedStamps > 0 ? 'rgba(200,144,42,0.12)' : 'rgba(26,46,26,0.06)',
                  border: `1.5px solid ${earnedStamps > 0 ? 'rgba(200,144,42,0.28)' : 'rgba(26,46,26,0.1)'}`,
                }}
              >
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: GREEN,
                    margin: 0,
                    textAlign: 'center',
                    lineHeight: 1.45,
                  }}
                >
                  {earnedStamps === 0
                    ? 'This order was under £2 — no stamp this time.'
                    : earnedStamps === 2
                      ? 'You earned 2 stamps on this order.'
                      : 'You earned 1 stamp on this order.'}
                </p>
              </div>
            ) : null}

            <h2
              id="feedback-modal-title"
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 26,
                fontWeight: 800,
                color: GREEN,
                letterSpacing: '-0.03em',
                textAlign: 'center',
                margin: '0 0 20px',
                lineHeight: 1.2,
              }}
            >
              How was your order?
            </h2>

            <StarRow value={rating} onChange={setRating} />

            <AnimatePresence>
              {rating != null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ marginTop: 18 }}
                >
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us more… (optional)"
                    rows={3}
                    className="focus:outline-none"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.55)',
                      border: '1.5px solid #e0d0b0',
                      borderRadius: 16,
                      padding: '14px 16px',
                      fontSize: 14,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      color: GREEN,
                      resize: 'none',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {hint ? (
              <p
                style={{
                  margin: '12px 0 0',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#b34a2a',
                  textAlign: 'center',
                }}
              >
                {hint}
              </p>
            ) : null}

            <motion.button
              type="button"
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              disabled={submitting}
              onClick={handleShare}
              style={{
                width: '100%',
                marginTop: 22,
                background: GREEN,
                color: CREAM,
                borderRadius: 22,
                padding: '16px 24px',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.65 : 1,
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                boxShadow: '0 4px 20px rgba(26,46,26,0.25)',
              }}
            >
              {submitting ? 'Sending…' : 'Share feedback'}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
