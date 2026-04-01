import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENTS } from '../data/mock';
import { filterAttended, filterRegisteredUpcoming } from '../lib/eventsSchedule';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { initialsFromName, formatMemberSince } from '../lib/userDisplay';
import { fetchCustomerOrders } from '../lib/api';
import { findUsualOrderFromHistory, apiOrderItemsToCartLines } from '../lib/usualOrder';
import SignInButton from '../components/SignInButton';
import { previewStampsEarnedForOrderTotal } from '../lib/loyaltyStampPreview';
import { StarRating, SectionHead } from './profile/ProfilePieces';

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E")`;

const EVENT_GRADIENTS = [
  'linear-gradient(148deg, #a04820 0%, #c87040 55%, #e09858 100%)',
  'linear-gradient(148deg, #2a0812 0%, #5a1428 55%, #782038 100%)',
  'linear-gradient(148deg, #7a5008 0%, #a87020 55%, #c89038 100%)',
  'linear-gradient(148deg, #4a2810 0%, #7a4820 55%, #a06830 100%)',
];

// ── PAGE ─────────────────────────────────────────────────────────────────

function formatHistoryOrderDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function orderSummaryLine(order) {
  const items = order.items || [];
  return items.map((it) => (it.quantity > 1 ? `${it.quantity}× ` : '') + (it.item_name || 'Item')).join(', ');
}

function startOfWeekMonday(ref) {
  const x = new Date(ref);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfCalendarMonth(ref) {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
}

const ORDERS_PAGE_SIZE = 6;

export default function Profile() {
  const navigate = useNavigate();
  const { activeOrder, clearActiveOrder, replaceCartLines, editOrderId, addingToOrderId } = useCart();
  const { user, isAuthenticated, logout, loading, authFetch } = useAuth();
  const {
    stampsCount,
    stampsGoal,
    stampsToNextReward,
    rewardsAvailable,
    loading: loyaltyLoading,
    error: loyaltyError,
  } = useLoyalty();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [ratings, setRatings] = useState({});
  const [events, setEvents] = useState(EVENTS);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [ordersForUsual, setOrdersForUsual] = useState([]);
  const [livePendingOrder, setLivePendingOrder] = useState(null);
  const [ordersHorizon, setOrdersHorizon] = useState('week');
  const [ordersPage, setOrdersPage] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setCompletedOrders([]);
      setOrdersForUsual([]);
      setLivePendingOrder(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      try {
        const [completed, forUsual, liveList] = await Promise.all([
          fetchCustomerOrders(authFetch, { status: 'completed' }),
          fetchCustomerOrders(authFetch, { status: 'completed', days: 60 }),
          fetchCustomerOrders(authFetch, { status: 'pending,confirmed' }),
        ]);
        if (!cancelled) {
          setCompletedOrders(completed);
          setOrdersForUsual(forUsual);
          setLivePendingOrder(liveList[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setCompletedOrders([]);
          setOrdersForUsual([]);
          setLivePendingOrder(null);
        }
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authFetch]);

  useEffect(() => {
    setExpandedOrder(null);
    setOrdersPage(0);
  }, [ordersHorizon]);

  useEffect(() => {
    setExpandedOrder(null);
  }, [ordersPage]);

  const usualResult = useMemo(() => findUsualOrderFromHistory(ordersForUsual), [ordersForUsual]);

  const pendingStampEarnCount = useMemo(() => {
    const ta = livePendingOrder?.total_amount;
    if (ta == null) return 0;
    return previewStampsEarnedForOrderTotal(ta).stamps;
  }, [livePendingOrder]);

  /** Server pending/confirmed, or cart tied to an in-flight order (avoid stale activeOrder after pickup). */
  const hasExistingOrderInProgress =
    livePendingOrder != null || editOrderId != null || addingToOrderId != null;

  const upcomingEvents = filterRegisteredUpcoming(events);
  const attendedEvents = filterAttended(events);
  const displayName = user?.displayName ?? 'Guest';
  const profileInitials = user ? initialsFromName(user.displayName) : 'G';
  const heroFirstName = isAuthenticated && user ? `${user.displayName.split(/\s+/)[0]}.` : 'Friend.';
  const memberSinceLabel = user?.createdAt ? formatMemberSince(user.createdAt) : null;
  const orderCount = user?.orderCount ?? 0;
  const eventsEngagementCount = attendedEvents.length + upcomingEvents.length;

  const filteredCompletedOrders = useMemo(() => {
    if (!completedOrders.length) return [];
    const now = new Date();
    if (ordersHorizon === 'all') return completedOrders;
    const start = ordersHorizon === 'month' ? startOfCalendarMonth(now) : startOfWeekMonday(now);
    return completedOrders.filter((o) => {
      if (!o.created_at) return false;
      return new Date(o.created_at) >= start;
    });
  }, [completedOrders, ordersHorizon]);

  const ordersPageCount = Math.max(1, Math.ceil(filteredCompletedOrders.length / ORDERS_PAGE_SIZE));

  const paginatedCompletedOrders = useMemo(() => {
    const start = ordersPage * ORDERS_PAGE_SIZE;
    return filteredCompletedOrders.slice(start, start + ORDERS_PAGE_SIZE);
  }, [filteredCompletedOrders, ordersPage]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredCompletedOrders.length / ORDERS_PAGE_SIZE) - 1);
    setOrdersPage((p) => Math.min(p, maxPage));
  }, [filteredCompletedOrders.length]);

  const handleRate = (id, stars) => setRatings((r) => ({ ...r, [id]: stars }));
  const toggleEvent = (id) => setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, registered: !e.registered } : e)));

  const handleLoadUsualToCart = async () => {
    if (hasExistingOrderInProgress || !usualResult?.items?.length) return;
    const lines = await apiOrderItemsToCartLines(usualResult.items);
    replaceCartLines(lines, {
      allergens: usualResult.allergens ?? [],
    });
    navigate('/order', { state: { openCart: true } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full overflow-y-auto scrollbar-hide"
      style={{ background: '#f0e6d0' }}
    >
      {/* ── HERO BAND ───────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)', paddingTop: 48, paddingBottom: 36 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none' }} />

        {/* Amber glow */}
        <motion.div
          style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(210,150,40,0.22) 0%, transparent 65%)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Green glow */}
        <motion.div
          style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(60,120,60,0.18) 0%, transparent 65%)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />

        {/* Decorative concentric rings — like coffee ripples */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} preserveAspectRatio="xMaxYMid slice">
          {[48, 88, 130, 174, 222].map((r, i) => (
            <circle key={i} cx="105%" cy="52%" r={r} fill="none" stroke="white" strokeWidth="0.7" opacity={0.045 + i * 0.008} strokeDasharray={i % 2 === 0 ? '6 5' : 'none'} />
          ))}
        </svg>

        {/* Botanical frond */}
        <motion.div
          style={{ position: 'absolute', right: '8%', top: -10, opacity: 0.24, pointerEvents: 'none', transformOrigin: '50% 100%' }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width={44} height={105} viewBox="0 0 50 120" fill="none">
            <path d="M25 118 C25 100 25 15 25 4" stroke="#6aaa6a" strokeWidth="1.4" strokeLinecap="round" />
            {[22, 40, 58, 76, 94].map((cy, i) => {
              const w = 22 - i * 2;
              return (
                <g key={i}>
                  <path
                    d={`M25 ${cy} C${25 - w} ${cy - 10} ${25 - w - 8} ${cy} ${25 - w - 2} ${cy + 10} C${25 - 6} ${cy + 14} ${25 - 3} ${cy + 5} 25 ${cy}`}
                    fill="#4a8a4a"
                    opacity={0.75 - i * 0.09}
                  />
                  <path
                    d={`M25 ${cy} C${25 + w} ${cy - 10} ${25 + w + 8} ${cy} ${25 + w + 2} ${cy + 10} C${25 + 6} ${cy + 14} ${25 + 3} ${cy + 5} 25 ${cy}`}
                    fill="#4a8a4a"
                    opacity={0.68 - i * 0.09}
                  />
                </g>
              );
            })}
          </svg>
        </motion.div>

        <div style={{ position: 'relative', padding: '0 22px' }}>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: '#c8902a', marginBottom: 18 }}>
            ✦ Your profile
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.08 }}
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: user?.avatarUrl ? 'transparent' : 'linear-gradient(140deg, #c8902a 0%, #deb040 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 28,
                fontWeight: 900,
                color: '#122012',
                boxShadow: '0 0 0 3px rgba(200,144,42,0.25), 0 6px 24px rgba(200,144,42,0.3)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profileInitials
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 28 }}
            >
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 42, fontWeight: 900, color: '#f0e6d0', letterSpacing: '-0.035em', lineHeight: 0.95, marginBottom: 6 }}>
                {heroFirstName}
              </h1>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(240,230,208,0.5)' }}>
                {isAuthenticated
                  ? memberSinceLabel
                    ? `Member since ${memberSinceLabel} · ${orderCount} order${orderCount === 1 ? '' : 's'}`
                    : `${orderCount} order${orderCount === 1 ? '' : 's'} with Clay & Bean`
                  : 'Sign in with Google to sync orders and rewards'}
              </p>
            </motion.div>
          </div>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 8 }}
          >
            {[
              { label: 'Orders', value: isAuthenticated ? String(orderCount) : '—' },
              {
                label: 'Stamps',
                value: isAuthenticated ? (loyaltyLoading ? '…' : `${stampsCount}/${stampsGoal}`) : '—',
              },
              { label: 'Events', value: String(eventsEngagementCount) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 800, color: '#f0e6d0' }}>{value}</span>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 600, color: 'rgba(240,230,208,0.45)', letterSpacing: '0.04em' }}>{label}</span>
              </div>
            ))}
          </motion.div>

          {isAuthenticated && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              onClick={() => logout()}
              style={{
                marginTop: 16,
                alignSelf: 'flex-start',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 100,
                padding: '8px 16px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(240,230,208,0.65)',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Sign out
            </motion.button>
          )}
        </div>
      </div>

      {/* ── PAGE BODY ─────────────────────────────────────────────── */}
      <div style={{ padding: '32px 18px 72px', display: 'flex', flexDirection: 'column', gap: 36 }}>

        {!loading && !isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(148deg, #fef9f0, #f5ead8)',
              border: '1.5px solid #e0d0b0',
              borderRadius: 20,
              padding: '20px 18px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 17,
                fontWeight: 800,
                color: '#1a2e1a',
                margin: '0 0 6px',
              }}
            >
              Sign in to get started
            </p>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: 'rgba(26,46,26,0.5)',
                margin: '0 0 16px',
                lineHeight: 1.45,
              }}
            >
              Place orders, save your usual, and join events with your Google account.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SignInButton />
            </div>
          </motion.section>
        )}

        {/* ── CURRENT ORDER ───────────────────────────────────────── */}
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
                    onClick={clearActiveOrder}
                    style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(26,46,26,0.5)', background: 'rgba(26,46,26,0.07)', border: '1.5px solid #d4c0a0', borderRadius: 100, padding: '5px 13px', cursor: 'pointer' }}
                  >
                    Dismiss
                  </motion.button>
                }
              />

              <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', boxShadow: '0 6px 28px rgba(0,0,0,0.14)' }}>
                {/* Dark green header */}
                <div style={{ background: 'linear-gradient(138deg, #0e1c0e 0%, #1a2e1a 60%, #223828 100%)', padding: '18px 18px 16px', position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,144,42,0.25) 0%, transparent 65%)', pointerEvents: 'none' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Spinner */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 36, height: 36 }}
                      >
                        <svg viewBox="0 0 36 36" fill="none" style={{ width: 36, height: 36 }}>
                          <circle cx="18" cy="18" r="15" stroke="rgba(200,144,42,0.2)" strokeWidth="3" />
                          <path d="M18 3 A15 15 0 0 1 33 18" stroke="#c8902a" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      </motion.div>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>☕</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 800, color: '#f0e6d0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        Order being prepared
                      </p>
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(240,230,208,0.55)' }}>
                        {activeOrder.pickupMinutes === 0 ? 'Ready as soon as possible' : `Pickup in ~${activeOrder.pickupMinutes} mins`}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, background: 'rgba(200,144,42,0.18)', border: '1px solid rgba(200,144,42,0.3)', borderRadius: 100, padding: '4px 11px' }}>
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#c8902a', letterSpacing: '0.06em' }}>
                        ● LIVE
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cream body — items list */}
                <div style={{ background: 'linear-gradient(148deg, #fef9f0, #f5ead8)', border: '1.5px solid #e0d0b0', borderTop: 'none', padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeOrder.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c8902a', flexShrink: 0 }} />
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#1a2e1a', flex: 1 }}>
                        {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                        {(item.showDrinkModifiers ?? item.showCoffeeOptions) !== false &&
                          [item.size !== 'Regular' && item.size, item.milk && !['Full Fat', 'Regular'].includes(item.milk) && item.milk].filter(Boolean).length > 0 && (
                          <span style={{ color: 'rgba(26,46,26,0.45)', fontSize: 11 }}>
                            {[item.size !== 'Regular' && item.size, item.milk && !['Full Fat', 'Regular'].includes(item.milk) && item.milk].filter(Boolean).map((m) => ` · ${m}`)}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(26,46,26,0.08)', marginTop: 6, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(26,46,26,0.4)' }}>
                      Total
                    </p>
                    <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 900, color: '#1a2e1a', letterSpacing: '-0.03em' }}>
                      £{(activeOrder.total / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── LOYALTY CARD ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 28 }}
        >
          <SectionHead label="Rewards" title="Your loyalty card" />

          <div style={{ background: 'linear-gradient(148deg, #faf2e2 0%, #f2e4cc 100%)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)', border: '1.5px solid #e0d0b0' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none', opacity: 0.3 }} />

              {/* Card header row */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid rgba(26,46,26,0.08)' }}>
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(26,46,26,0.4)' }}>
                  Loyalty Card
                </p>
                <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.01em' }}>
                  {displayName}
                </p>
              </div>

              {/* Card body: stamps (full width) */}
              <div style={{ position: 'relative', padding: '16px 18px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6, marginBottom: 12 }}>
                  {Array.from({ length: stampsGoal }).map((_, i) => {
                    const filled = isAuthenticated && !loyaltyLoading && i < stampsCount;
                    const pending =
                      isAuthenticated &&
                      !loyaltyLoading &&
                      pendingStampEarnCount > 0 &&
                      i >= stampsCount &&
                      i < stampsCount + pendingStampEarnCount;
                    return (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={
                          filled
                            ? { scale: 1, opacity: 1 }
                            : pending
                              ? { scale: 0.94, opacity: 0.88 }
                              : { scale: 0.88, opacity: 0.5 }
                        }
                        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: filled ? i * 0.04 : 0 }}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '50%',
                          background: filled
                            ? 'linear-gradient(140deg, #c8902a, #d8aa38)'
                            : pending
                              ? 'linear-gradient(145deg, rgba(90,130,90,0.22), rgba(120,160,120,0.28))'
                              : 'rgba(26,46,26,0.1)',
                          border: filled
                            ? '1px solid rgba(210,160,50,0.5)'
                            : pending
                              ? '1.5px solid rgba(60,100,60,0.28)'
                              : '1.5px solid rgba(26,46,26,0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: filled ? '0 2px 6px rgba(180,120,20,0.28)' : pending ? '0 1px 4px rgba(40,80,40,0.12)' : 'none',
                        }}
                      >
                        {filled && <div style={{ width: '38%', height: '38%', borderRadius: '50%', background: 'rgba(255,245,210,0.65)' }} />}
                      </motion.div>
                    );
                  })}
                </div>

                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#1a2e1a', marginBottom: 2 }}>
                  {loyaltyLoading
                    ? 'Loading…'
                    : !isAuthenticated
                      ? `0 of ${stampsGoal} stamps collected`
                      : `${stampsCount} of ${stampsGoal} stamps collected`}
                </p>

                {loyaltyError ? (
                  <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#b34a2a', marginTop: 8 }}>{loyaltyError}</p>
                ) : null}
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.35)', marginTop: 8, fontStyle: 'italic' }}>
                  Earn stamps when you collect a £2+ app order, watch out for promotions!
                </p>
                {isAuthenticated && !loyaltyLoading && rewardsAvailable > 0 ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.985 }}
                    animate={{ boxShadow: ['0 12px 36px rgba(26,46,26,0.12)', '0 14px 40px rgba(60,100,60,0.14)', '0 12px 36px rgba(26,46,26,0.12)'] }}
                    transition={{ boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } }}
                    onClick={() => navigate('/rewards')}
                    style={{
                      marginTop: 18,
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 18,
                      fontWeight: 800,
                      color: '#1a2e1a',
                      background: 'linear-gradient(165deg, #fffdf8 0%, #f5f0e4 45%, #ebe4d4 100%)',
                      border: '1px solid rgba(26,46,26,0.1)',
                      borderRadius: 20,
                      padding: '22px 20px',
                      cursor: 'pointer',
                      boxShadow: '0 12px 36px rgba(26,46,26,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
                    }}
                  >
                    <span style={{ display: 'block', marginBottom: 6 }}>
                      {rewardsAvailable} free drink{rewardsAvailable === 1 ? '' : 's'} waiting ☕
                    </span>
                    <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'rgba(26,46,26,0.48)' }}>
                      View rewards → use at checkout
                    </span>
                  </motion.button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── YOUR USUAL (from order history) ─────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 28 }}
        >
          <SectionHead label="Saved order" title="Your usual" />

          {!isAuthenticated ? (
            <div style={{ background: 'rgba(255,255,255,0.45)', border: '1.5px solid #e0d0b0', borderRadius: 18, padding: '22px 18px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#1a2e1a', margin: '0 0 8px' }}>Sign in to see your usual</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(26,46,26,0.45)', margin: '0 0 14px', lineHeight: 1.45 }}>
                We detect when you order the same items (including modifiers) more than three times in two months — then you can load that order in one tap.
              </p>
              <SignInButton />
            </div>
          ) : ordersLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#8a7868' }}>Checking your orders…</div>
          ) : !usualResult ? (
            <div style={{ background: 'rgba(255,255,255,0.4)', border: '1.5px dashed #d4c0a0', borderRadius: 18, padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 700, color: 'rgba(26,46,26,0.45)', marginBottom: 6 }}>No usual yet</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(26,46,26,0.35)', lineHeight: 1.5 }}>
                Order the exact same basket (every item and modifier) at least four times within two months — we&apos;ll surface it here so you can reorder instantly.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.45)', margin: 0 }}>
                You&apos;ve ordered this {usualResult.matchCount} times in the last 2 months.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {usualResult.items.map((it) => (
                  <div
                    key={it.id}
                    style={{
                      background: 'linear-gradient(148deg, #fef9f0, #f5ead8)',
                      border: '1.5px solid #e0d0b0',
                      borderRadius: 18,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(145deg, #f5e5b8, #e8cc88)', border: '2px solid #f0e6d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {it.item_emoji || '☕'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 700, color: '#1a2e1a', marginBottom: 2 }}>
                        {it.quantity > 1 ? `${it.quantity}× ` : ''}
                        {it.item_name}
                      </p>
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.45)' }}>
                        £{((it.unit_price * it.quantity) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <motion.button
                type="button"
                whileTap={hasExistingOrderInProgress ? undefined : { scale: 0.98 }}
                disabled={hasExistingOrderInProgress}
                onClick={handleLoadUsualToCart}
                style={{
                  width: '100%',
                  background: hasExistingOrderInProgress
                    ? 'rgba(26,46,26,0.08)'
                    : 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
                  color: hasExistingOrderInProgress ? 'rgba(26,46,26,0.45)' : '#122012',
                  border: hasExistingOrderInProgress ? '1.5px solid rgba(26,46,26,0.12)' : 'none',
                  borderRadius: 16,
                  padding: '14px 18px',
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: hasExistingOrderInProgress ? 'not-allowed' : 'pointer',
                  boxShadow: hasExistingOrderInProgress ? 'none' : '0 4px 18px rgba(200,144,42,0.35)',
                }}
              >
                {hasExistingOrderInProgress ? 'Order already in progress' : 'Quick order my usual'}
              </motion.button>
            </div>
          )}
        </motion.section>

        {/* ── UPCOMING EVENTS ─────────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 28 }}
          >
            <SectionHead label="What's coming up" title="You're going to" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {upcomingEvents.map((event, idx) => {
                const eventIdx = EVENTS.findIndex((e) => e.id === event.id);
                const gradient = EVENT_GRADIENTS[eventIdx % EVENT_GRADIENTS.length];
                return (
                  <motion.div
                    key={event.id}
                    style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
                  >
                    {/* Background */}
                    <div style={{ position: 'absolute', inset: 0, background: gradient }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)' }} />

                    {/* Content */}
                    <div style={{ position: 'relative', padding: '18px 18px 16px' }}>
                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {event.emoji}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>
                              {event.date} · {event.time}
                            </p>
                            <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                              {event.title}
                            </h3>
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '4px 11px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', flexShrink: 0 }}>
                          ✓ Going
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {event.description}
                      </p>

                      {/* Footer row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 600, color: event.spotsLeft != null && event.spotsLeft <= 3 ? '#ffaa80' : 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
                          {event.spotsLeft == null ? '● Drop in anytime' : event.spotsLeft === 0 ? '● Full' : event.spotsLeft <= 3 ? `● Only ${event.spotsLeft} spots left!` : `● ${event.spotsLeft} of ${event.totalSpots} spots left`}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleEvent(event.id)}
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.03em', backdropFilter: 'blur(4px)' }}
                        >
                          Cancel booking
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── ORDER HISTORY ────────────────────────────────────────── */}
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

        {/* ── EVENTS YOU ATTENDED (derived from bookings that have passed) ── */}
        {attendedEvents.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 28 }}
          >
            <SectionHead label="Memories" title="Events you attended" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {attendedEvents.map((event) => (
                <div
                  key={event.id}
                  style={{ background: 'linear-gradient(148deg, #fef9f0, #f5ead8)', border: '1.5px solid #e0d0b0', borderRadius: 20, padding: '18px 18px 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(145deg, #e8e0d0, #d4c8b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {event.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 700, color: '#1a2e1a' }}>
                          {event.title}
                        </p>
                        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a9a78', background: '#d4e8d0', padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                          ✓ Attended
                        </span>
                      </div>
                      <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.45)' }}>
                        {event.date}
                        {event.time ? ` · ${event.time}` : ''}
                      </p>
                    </div>
                  </div>

                  <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12.5, color: 'rgba(26,46,26,0.65)', lineHeight: 1.55, marginBottom: 14 }}>
                    {event.description}
                  </p>

                  <div style={{ height: 1, background: 'rgba(26,46,26,0.08)', marginBottom: 12 }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 600, color: ratings[event.id] ? '#c8902a' : 'rgba(26,46,26,0.4)', letterSpacing: '0.02em' }}>
                      {ratings[event.id] ? 'Your rating' : 'Rate this event'}
                    </p>
                    <StarRating
                      value={ratings[event.id] || 0}
                      onChange={(stars) => handleRate(event.id, stars)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        ) : null}

      </div>
    </motion.div>
  );
}
