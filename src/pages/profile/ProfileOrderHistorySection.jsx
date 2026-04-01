import { motion, AnimatePresence } from 'framer-motion';
import SignInButton from '../../components/SignInButton';
import { SectionHead } from './ProfilePieces';
import {
  formatHistoryOrderDate,
  orderSummaryLine,
  ORDERS_PAGE_SIZE,
} from '../../lib/profileUtils';

export default function ProfileOrderHistorySection({
  isAuthenticated,
  ordersLoading,
  completedOrders,
  ordersHorizon,
  setOrdersHorizon,
  filteredCompletedOrders,
  paginatedCompletedOrders,
  expandedOrder,
  setExpandedOrder,
  ordersPage,
  setOrdersPage,
  ordersPageCount,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 28 }}
    >
      <SectionHead label="History" title="Past orders" />

      {!isAuthenticated ? (
        <div style={{ background: 'rgba(255,255,255,0.45)', border: '1.5px solid #e0d0b0', borderRadius: 18, padding: '22px 18px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#1a2e1a', margin: '0 0 8px' }}>Sign in to see your order history</p>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(26,46,26,0.45)', margin: '0 0 14px', lineHeight: 1.45 }}>
            Your completed orders from Clay & Bean will appear here.
          </p>
          <SignInButton />
        </div>
      ) : ordersLoading ? (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#8a7868' }}>Loading history…</div>
      ) : completedOrders.length === 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.4)', border: '1.5px dashed #d4c0a0', borderRadius: 18, padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 700, color: 'rgba(26,46,26,0.45)', marginBottom: 4 }}>No past orders yet</p>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(26,46,26,0.35)' }}>When you complete an order, it will show up here.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {[
              { id: 'week', label: 'This week' },
              { id: 'month', label: 'This month' },
              { id: 'all', label: 'All time' },
            ].map(({ id, label }) => {
              const active = ordersHorizon === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOrdersHorizon(id)}
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '8px 14px',
                    borderRadius: 100,
                    border: active ? '1.5px solid #c8902a' : '1.5px solid #d4c0a0',
                    background: active ? 'rgba(200,144,42,0.18)' : 'rgba(255,255,255,0.45)',
                    color: active ? '#1a2e1a' : 'rgba(26,46,26,0.55)',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {filteredCompletedOrders.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.4)', border: '1.5px dashed #d4c0a0', borderRadius: 18, padding: '20px 18px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: 'rgba(26,46,26,0.5)', margin: 0, lineHeight: 1.45 }}>
                {ordersHorizon === 'week'
                  ? 'No orders this week. Try this month or all time.'
                  : ordersHorizon === 'month'
                    ? 'No orders this month. Try all time.'
                    : 'No orders in this range.'}
              </p>
            </div>
          ) : (
        <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paginatedCompletedOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              layout
              style={{ background: 'linear-gradient(148deg, #fef9f0, #f5ead8)', border: '1.5px solid #e0d0b0', borderRadius: 18, overflow: 'hidden' }}
            >
              <button
                type="button"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(26,46,26,0.07)', border: '1.5px solid #d4c0a0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 11, fontWeight: 800, color: 'rgba(26,46,26,0.4)' }}>
                      {filteredCompletedOrders.length - (ordersPage * ORDERS_PAGE_SIZE + idx)}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 700, color: '#1a2e1a', marginBottom: 2 }}>
                      {formatHistoryOrderDate(order.created_at)}
                    </p>
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {orderSummaryLine(order)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 800, color: '#1a2e1a' }}>
                    £{(order.total_amount / 100).toFixed(2)}
                  </span>
                  <motion.span
                    animate={{ rotate: expandedOrder === order.id ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    style={{ display: 'inline-block', color: 'rgba(26,46,26,0.35)', fontSize: 12 }}
                  >
                    ↓
                  </motion.span>
                </div>
              </button>

              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid rgba(26,46,26,0.08)', padding: '12px 16px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {(order.items || []).map((line) => (
                          <div key={line.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c8902a', flexShrink: 0 }} />
                            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#1a2e1a' }}>
                              {line.quantity > 1 ? `${line.quantity}× ` : ''}
                              {line.item_name}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, color: 'rgba(26,46,26,0.3)', letterSpacing: '0.06em' }}>
                        Order #{order.id}
                        {order.square_order_id ? ` · ${order.square_order_id}` : ''}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        {filteredCompletedOrders.length > ORDERS_PAGE_SIZE ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              disabled={ordersPage <= 0}
              onClick={() => setOrdersPage((p) => Math.max(0, p - 1))}
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 100,
                border: '1.5px solid #d4c0a0',
                background: ordersPage <= 0 ? 'rgba(26,46,26,0.06)' : 'rgba(255,255,255,0.5)',
                color: ordersPage <= 0 ? 'rgba(26,46,26,0.35)' : '#1a2e1a',
                cursor: ordersPage <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(26,46,26,0.5)',
              }}
            >
              Page {ordersPage + 1} of {ordersPageCount}
            </span>
            <button
              type="button"
              disabled={ordersPage >= ordersPageCount - 1}
              onClick={() => setOrdersPage((p) => Math.min(ordersPageCount - 1, p + 1))}
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 100,
                border: '1.5px solid #d4c0a0',
                background: ordersPage >= ordersPageCount - 1 ? 'rgba(26,46,26,0.06)' : 'rgba(255,255,255,0.5)',
                color: ordersPage >= ordersPageCount - 1 ? 'rgba(26,46,26,0.35)' : '#1a2e1a',
                cursor: ordersPage >= ordersPageCount - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        ) : null}
            </>
          )}
        </>
      )}
    </motion.section>
  );
}
