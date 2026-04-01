import { motion, AnimatePresence } from 'framer-motion';
import { SectionHead } from './ProfilePieces';

export default function ProfileActiveOrderCard({ activeOrder, onDismiss }) {
  return (
    <AnimatePresence>
      {activeOrder && (
        <motion.section
          key="current-order"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
          <SectionHead
            label="In progress"
            title="Current order"
            action={
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onDismiss}
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(26,46,26,0.5)',
                  background: 'rgba(26,46,26,0.07)',
                  border: '1.5px solid #d4c0a0',
                  borderRadius: 100,
                  padding: '5px 13px',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </motion.button>
            }
          />

          <div
            style={{
              position: 'relative',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 6px 28px rgba(0,0,0,0.14)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(138deg, #0e1c0e 0%, #1a2e1a 60%, #223828 100%)',
                padding: '18px 18px 16px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(200,144,42,0.25) 0%, transparent 65%)',
                  pointerEvents: 'none',
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 36, height: 36 }}
                  >
                    <svg viewBox="0 0 36 36" fill="none" style={{ width: 36, height: 36 }}>
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        stroke="rgba(200,144,42,0.2)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 3 A15 15 0 0 1 33 18"
                        stroke="#c8902a"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </motion.div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    ☕
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#f0e6d0',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    Order being prepared
                  </p>
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 12,
                      color: 'rgba(240,230,208,0.55)',
                    }}
                  >
                    {activeOrder.pickupMinutes === 0
                      ? 'Ready as soon as possible'
                      : `Pickup in ~${activeOrder.pickupMinutes} mins`}
                  </p>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    background: 'rgba(200,144,42,0.18)',
                    border: '1px solid rgba(200,144,42,0.3)',
                    borderRadius: 100,
                    padding: '4px 11px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#c8902a',
                      letterSpacing: '0.06em',
                    }}
                  >
                    ● LIVE
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(148deg, #fef9f0, #f5ead8)',
                border: '1.5px solid #e0d0b0',
                borderTop: 'none',
                padding: '14px 18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {activeOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#c8902a',
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 13,
                      color: '#1a2e1a',
                      flex: 1,
                    }}
                  >
                    {item.quantity > 1 ? `${item.quantity}× ` : ''}
                    {item.name}
                    {(item.showDrinkModifiers ?? item.showCoffeeOptions) !== false &&
                      [
                        item.size !== 'Regular' && item.size,
                        item.milk && !['Full Fat', 'Regular'].includes(item.milk) && item.milk,
                      ].filter(Boolean).length > 0 && (
                        <span style={{ color: 'rgba(26,46,26,0.45)', fontSize: 11 }}>
                          {[
                            item.size !== 'Regular' && item.size,
                            item.milk && !['Full Fat', 'Regular'].includes(item.milk) && item.milk,
                          ]
                            .filter(Boolean)
                            .map((m) => ` · ${m}`)}
                        </span>
                      )}
                  </p>
                </div>
              ))}
              <div
                style={{
                  borderTop: '1px solid rgba(26,46,26,0.08)',
                  marginTop: 6,
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(26,46,26,0.4)',
                  }}
                >
                  Total
                </p>
                <p
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#1a2e1a',
                    letterSpacing: '-0.03em',
                  }}
                >
                  £{(activeOrder.total / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
