import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MenuItem({
  item,
  onTap,
  disabled = false,
  basketQty = 0,
  orderedQty = 0,
  /** When false, basket lines are a normal pre-checkout cart (label "in cart"). */
  orderEditMode = false,
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const pricePounds = (item.price / 100).toFixed(2);
  const hasBasket = basketQty > 0;
  const hasOrdered = orderedQty > 0;
  const hasAny = hasBasket || hasOrdered;

  let borderColor = '#e0d0b0';
  let borderWidth = 1.5;
  if (hasBasket && hasOrdered) {
    borderColor = '#1a2e1a';
    borderWidth = 2;
  } else if (hasOrdered) {
    borderColor = '#2d4a2d';
    borderWidth = 2;
  } else if (hasBasket) {
    borderColor = '#c8902a';
    borderWidth = 2;
  }

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={() => !disabled && onTap(item)}
      disabled={disabled}
      style={{
        background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 20,
        overflow: 'hidden',
        width: '100%',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: hasAny ? '0 4px 16px rgba(26,46,26,0.12)' : '0 2px 12px rgba(26,46,26,0.07)',
        textAlign: 'left',
        padding: 0,
        position: 'relative',
      }}
    >
      {/* Top section — emoji */}
      <div
        style={{
          background: 'linear-gradient(155deg, #f5ecd8 0%, #eedfc4 100%)',
          padding: '20px 16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {(hasOrdered || hasBasket) && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            {hasOrdered && (
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#f0e6d0',
                  background: '#1a2e1a',
                  borderRadius: 100,
                  padding: '4px 8px',
                  lineHeight: 1.2,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}
              >
                {orderedQty}
              </span>
            )}
            {hasBasket && (
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#122012',
                  background: 'linear-gradient(128deg, #c8902a 0%, #deb040 100%)',
                  borderRadius: 100,
                  padding: '3px 8px',
                  lineHeight: 1.2,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                {orderEditMode ? `${basketQty} new` : `${basketQty} in cart`}
              </span>
            )}
          </div>
        )}
        {item.iconUrl && !iconFailed ? (
          <img
            src={item.iconUrl}
            alt=""
            width={72}
            height={72}
            style={{ width: 72, height: 72, objectFit: 'contain' }}
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span style={{ fontSize: 38, lineHeight: 1 }}>{item.emoji}</span>
        )}
      </div>

      {/* Bottom section — name + price */}
      <div style={{ padding: '10px 14px 14px' }}>
        <p
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 14,
            fontWeight: 700,
            color: '#1a2e1a',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: '#c8902a',
            marginTop: 4,
            margin: '4px 0 0',
          }}
        >
          £{pricePounds}
        </p>
      </div>
    </motion.button>
  );
}
