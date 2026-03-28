import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CREAM = '#f0e6d0';
const GREEN = '#1a2e1a';
const GOLD = 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onLeaveReview
 * @param {() => void} props.onMaybeLater
 */
export default function GoogleReviewPrompt({ isOpen, onLeaveReview, onMaybeLater }) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 310,
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
            aria-labelledby="google-review-title"
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
              padding: '28px 22px calc(28px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <h2
              id="google-review-title"
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 24,
                fontWeight: 800,
                color: GREEN,
                letterSpacing: '-0.03em',
                textAlign: 'center',
                margin: '0 0 10px',
                lineHeight: 1.25,
              }}
            >
              Help others discover
              <br />
              Clay &amp; Bean
            </h2>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 14,
                color: 'rgba(26,46,26,0.55)',
                textAlign: 'center',
                margin: '0 0 24px',
                lineHeight: 1.5,
              }}
            >
              We really appreciate the support.
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onLeaveReview}
              style={{
                width: '100%',
                background: GOLD,
                color: '#122012',
                borderRadius: 22,
                padding: '16px 24px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: 12,
                marginTop: 16,
                boxShadow: '0 4px 20px rgba(200,144,42,0.35)',
              }}
            >
              Leave Google Review
            </motion.button>
            <button
              type="button"
              onClick={onMaybeLater}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(26,46,26,0.45)',
                cursor: 'pointer',
                padding: '12px 8px',
              }}
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
