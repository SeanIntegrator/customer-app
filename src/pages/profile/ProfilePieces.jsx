import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAR_LABELS = ['', 'Not for me', 'It was alright', 'Pretty good', 'Loved it', 'Absolutely brilliant'];

export function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            animate={{ scale: star <= display ? 1 : 0.85 }}
            whileTap={{ scale: 1.5, rotate: [0, -18, 18, -8, 0] }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 18 }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star === value ? 0 : star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 4px',
              fontSize: 22,
              lineHeight: 1,
              color: star <= display ? '#c8902a' : 'rgba(26,46,26,0.18)',
              filter: star <= display ? 'drop-shadow(0 1px 4px rgba(200,144,42,0.45))' : 'none',
              transition: 'color 0.12s ease, filter 0.12s ease',
            }}
          >
            ★
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {display > 0 && (
          <motion.span
            key={display}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: value > 0 ? '#c8902a' : 'rgba(26,46,26,0.4)',
            }}
          >
            {STAR_LABELS[display]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SectionHead({ label, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#c8902a',
            marginBottom: 3,
          }}
        >
          ✦ {label}
        </p>
        <h2
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 22,
            fontWeight: 800,
            color: '#1a2e1a',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
