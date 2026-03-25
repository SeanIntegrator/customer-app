import { motion, AnimatePresence } from 'framer-motion';
import { goldCardPickupChipLabel } from '../../lib/pickup';
import Steam from './Steam';

const DEFAULT_MILKS = ['Full Fat', 'Regular'];

export default function HomeBridgingCta({
  bridgingCtaLoading,
  goldCardModel,
  navigate,
  onEditOrderTap,
}) {
  return (
    <div style={{ margin: '-42px 18px 0', position: 'relative', zIndex: 10 }}>
      <AnimatePresence mode="wait">
        {bridgingCtaLoading ? (
          <motion.div
            key="order-skeleton"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(180,120,18,0.22), 0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)', padding: '16px 22px 18px' }}>
              <div style={{ width: '55%', height: 10, borderRadius: 100, background: 'rgba(18,32,18,0.12)', marginBottom: 14 }} />
              <div style={{ width: '72%', height: 22, borderRadius: 8, background: 'rgba(18,32,18,0.14)' }} />
            </div>
            <div style={{ background: '#faf5eb', padding: '18px 22px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[1, 2].map((k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(26,46,26,0.08)' }} />
                    <div style={{ flex: 1, height: 14, borderRadius: 6, background: 'rgba(26,46,26,0.07)' }} />
                  </div>
                ))}
              </div>
              <div style={{ height: 12, width: '40%', borderRadius: 6, background: 'rgba(26,46,26,0.06)', marginLeft: 'auto' }} />
            </div>
          </motion.div>
        ) : goldCardModel ? (
          <motion.div
            key="active-order"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{
              opacity: { delay: 0.1, duration: 0.35 },
              y: { delay: 0.1, type: 'spring', stiffness: 280, damping: 26 },
              scale: { delay: 0.1, type: 'spring', stiffness: 280, damping: 26 },
            }}
            onClick={() => {
              if (goldCardModel.editable && goldCardModel.id != null) {
                onEditOrderTap(goldCardModel.id);
              } else {
                navigate('/profile');
              }
            }}
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 10px 40px rgba(180,120,18,0.38), 0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)', padding: '16px 22px 18px' }}>
              <div style={{ width: '100%', height: 3, background: 'rgba(18,32,18,0.15)', borderRadius: 100, overflow: 'hidden', marginBottom: 14 }}>
                <motion.div
                  style={{ height: '100%', width: '38%', background: 'rgba(18,32,18,0.45)', borderRadius: 100 }}
                  animate={{ x: ['-100%', '290%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 26, fontWeight: 800, color: '#122012', letterSpacing: '-0.025em', lineHeight: 1.05 }}>Order being prepared.</p>
                <motion.span
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#122012', background: 'rgba(18,32,18,0.16)', borderRadius: 100, padding: '5px 11px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 4 }}
                >
                  {goldCardPickupChipLabel(goldCardModel.pickupMinutes)}
                </motion.span>
              </div>
            </div>

            <div style={{ background: '#faf5eb', padding: '14px 22px 18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                {goldCardModel.items.map((item, i) => {
                  const mods = [item.size !== 'Regular' && item.size, !DEFAULT_MILKS.includes(item.milk) && item.milk].filter(Boolean).join(', ');
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{item.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#1a2e1a' }}>
                          {item.quantity > 1 ? `${item.quantity}× ` : ''}
                          {item.name}
                        </span>
                        {mods && <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(26,46,26,0.45)', display: 'block' }}>{mods}</span>}
                      </div>
                      {item.totalPrice != null && (
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#1a2e1a', flexShrink: 0 }}>
                          £{((item.totalPrice * item.quantity) / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1.5px solid rgba(26,46,26,0.1)', paddingTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(26,46,26,0.4)' }}>Total</span>
                <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 900, color: '#1a2e1a', letterSpacing: '-0.03em' }}>£{(goldCardModel.total_amount / 100).toFixed(2)}</span>
              </div>

              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'rgba(26,46,26,0.35)', textAlign: 'right', marginTop: 8 }}>
                {goldCardModel.editable ? 'Tap to edit order ›' : 'View details ›'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="start-order"
            type="button"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow: [
                '0 10px 48px rgba(180,120,18,0.44), 0 2px 8px rgba(0,0,0,0.14)',
                '0 14px 72px rgba(210,150,30,0.78), 0 2px 8px rgba(0,0,0,0.14)',
                '0 10px 48px rgba(180,120,18,0.44), 0 2px 8px rgba(0,0,0,0.14)',
              ],
            }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{
              opacity: { delay: 0.26, duration: 0.4 },
              y: { delay: 0.26, type: 'spring', stiffness: 280, damping: 26 },
              scale: { delay: 0.26, type: 'spring', stiffness: 280, damping: 26 },
              boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/order')}
            style={{ width: '100%', background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)', borderRadius: 24, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: 'pointer' }}
          >
            <div>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(18,32,18,0.52)', marginBottom: 5 }}>Ready to order?</p>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 800, color: '#122012', letterSpacing: '-0.025em', lineHeight: 1.0 }}>Start your order</p>
            </div>
            <div style={{ position: 'relative', paddingBottom: 18, flexShrink: 0 }}>
              <span style={{ fontSize: 44, lineHeight: 1, display: 'block' }}>☕</span>
              <Steam />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
