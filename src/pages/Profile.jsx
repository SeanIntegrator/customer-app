import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import ProfileHeroBand from './profile/ProfileHeroBand';
import ProfileOrderHistorySection from './profile/ProfileOrderHistorySection';
import ProfileGuestSignInSection from './profile/ProfileGuestSignInSection';
import ProfileActiveOrderCard from './profile/ProfileActiveOrderCard';
import {
  PROFILE_GRAIN,
  EVENT_GRADIENTS,
  ORDERS_PAGE_SIZE,
  startOfWeekMonday,
  startOfCalendarMonth,
} from '../lib/profileUtils';

export default function Profile() {
  const navigate = useNavigate();
  const { activeOrder, clearActiveOrder, replaceCartLines, editOrderId, addingToOrderId } =
    useCart();
  const { user, isAuthenticated, logout, loading, authFetch } = useAuth();
  const {
    stampsCount,
    stampsGoal,
    stampsToNextReward: _stampsToNextReward,
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
  const heroFirstName =
    isAuthenticated && user ? `${user.displayName.split(/\s+/)[0]}.` : 'Friend.';
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
  const toggleEvent = (id) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, registered: !e.registered } : e)));

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
      <ProfileHeroBand
        user={user}
        profileInitials={profileInitials}
        heroFirstName={heroFirstName}
        memberSinceLabel={memberSinceLabel}
        orderCount={orderCount}
        isAuthenticated={isAuthenticated}
        loyaltyLoading={loyaltyLoading}
        stampsCount={stampsCount}
        stampsGoal={stampsGoal}
        eventsEngagementCount={eventsEngagementCount}
        logout={logout}
      />
      {/* ── PAGE BODY ─────────────────────────────────────────────── */}
      <div
        className="app-content w-full"
        style={{ paddingTop: 32, paddingBottom: 72, display: 'flex', flexDirection: 'column', gap: 36 }}
      >
        {!loading && !isAuthenticated && <ProfileGuestSignInSection />}

        <ProfileActiveOrderCard activeOrder={activeOrder} onDismiss={clearActiveOrder} />

        {/* ── LOYALTY CARD ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 28 }}
        >
          <SectionHead label="Rewards" title="Your loyalty card" />

          <div
            className="w-full max-w-[min(100%,448px)] mx-auto lg:mx-0"
            style={{
              background: 'linear-gradient(148deg, #faf2e2 0%, #f2e4cc 100%)',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
              border: '1.5px solid #e0d0b0',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: PROFILE_GRAIN,
                  pointerEvents: 'none',
                  opacity: 0.3,
                }}
              />

              {/* Card header row */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px 12px',
                  borderBottom: '1px solid rgba(26,46,26,0.08)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: 'rgba(26,46,26,0.4)',
                  }}
                >
                  Loyalty Card
                </p>
                <p
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#1a2e1a',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {displayName}
                </p>
              </div>

              {/* Card body: stamps (full width) */}
              <div style={{ position: 'relative', padding: '16px 18px 20px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
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
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 22,
                          delay: filled ? i * 0.04 : 0,
                        }}
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
                          boxShadow: filled
                            ? '0 2px 6px rgba(180,120,20,0.28)'
                            : pending
                              ? '0 1px 4px rgba(40,80,40,0.12)'
                              : 'none',
                        }}
                      >
                        {filled && (
                          <div
                            style={{
                              width: '38%',
                              height: '38%',
                              borderRadius: '50%',
                              background: 'rgba(255,245,210,0.65)',
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#1a2e1a',
                    marginBottom: 2,
                  }}
                >
                  {loyaltyLoading
                    ? 'Loading…'
                    : !isAuthenticated
                      ? `0 of ${stampsGoal} stamps collected`
                      : `${stampsCount} of ${stampsGoal} stamps collected`}
                </p>

                {loyaltyError ? (
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 11,
                      color: '#b34a2a',
                      marginTop: 8,
                    }}
                  >
                    {loyaltyError}
                  </p>
                ) : null}
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    color: 'rgba(26,46,26,0.35)',
                    marginTop: 8,
                    fontStyle: 'italic',
                  }}
                >
                  Earn stamps when you collect a £2+ app order, watch out for promotions!
                </p>
                {isAuthenticated && !loyaltyLoading && rewardsAvailable > 0 ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.985 }}
                    animate={{
                      boxShadow: [
                        '0 12px 36px rgba(26,46,26,0.12)',
                        '0 14px 40px rgba(60,100,60,0.14)',
                        '0 12px 36px rgba(26,46,26,0.12)',
                      ],
                    }}
                    transition={{
                      boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
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
                      boxShadow:
                        '0 12px 36px rgba(26,46,26,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
                    }}
                  >
                    <span style={{ display: 'block', marginBottom: 6 }}>
                      {rewardsAvailable} free drink{rewardsAvailable === 1 ? '' : 's'} waiting ☕
                    </span>
                    <span
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'rgba(26,46,26,0.48)',
                      }}
                    >
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
            <div
              style={{
                background: 'rgba(255,255,255,0.45)',
                border: '1.5px solid #e0d0b0',
                borderRadius: 18,
                padding: '22px 18px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#1a2e1a',
                  margin: '0 0 8px',
                }}
              >
                Sign in to see your usual
              </p>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 12,
                  color: 'rgba(26,46,26,0.45)',
                  margin: '0 0 14px',
                  lineHeight: 1.45,
                }}
              >
                We detect when you order the same items (including modifiers) more than three times
                in two months — then you can load that order in one tap.
              </p>
              <SignInButton />
            </div>
          ) : ordersLoading ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                color: '#8a7868',
              }}
            >
              Checking your orders…
            </div>
          ) : !usualResult ? (
            <div
              style={{
                background: 'rgba(255,255,255,0.4)',
                border: '1.5px dashed #d4c0a0',
                borderRadius: 18,
                padding: '24px 20px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'rgba(26,46,26,0.45)',
                  marginBottom: 6,
                }}
              >
                No usual yet
              </p>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 12,
                  color: 'rgba(26,46,26,0.35)',
                  lineHeight: 1.5,
                }}
              >
                Order the exact same basket (every item and modifier) at least four times within two
                months — we&apos;ll surface it here so you can reorder instantly.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  color: 'rgba(26,46,26,0.45)',
                  margin: 0,
                }}
              >
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
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #f5e5b8, #e8cc88)',
                        border: '2px solid #f0e6d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {it.item_emoji || '☕'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#1a2e1a',
                          marginBottom: 2,
                        }}
                      >
                        {it.quantity > 1 ? `${it.quantity}× ` : ''}
                        {it.item_name}
                      </p>
                      <p
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 11,
                          color: 'rgba(26,46,26,0.45)',
                        }}
                      >
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
                  boxShadow: hasExistingOrderInProgress
                    ? 'none'
                    : '0 4px 18px rgba(200,144,42,0.35)',
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
              {upcomingEvents.map((event) => {
                const eventIdx = EVENTS.findIndex((e) => e.id === event.id);
                const gradient = EVENT_GRADIENTS[eventIdx % EVENT_GRADIENTS.length];
                return (
                  <motion.div
                    key={event.id}
                    style={{
                      position: 'relative',
                      borderRadius: 22,
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    }}
                  >
                    {/* Background */}
                    <div style={{ position: 'absolute', inset: 0, background: gradient }} />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
                      }}
                    />

                    {/* Content */}
                    <div style={{ position: 'relative', padding: '18px 18px 16px' }}>
                      {/* Top row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(6px)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                            }}
                          >
                            {event.emoji}
                          </div>
                          <div>
                            <p
                              style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 9,
                                fontWeight: 700,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.65)',
                                marginBottom: 2,
                              }}
                            >
                              {event.date} · {event.time}
                            </p>
                            <h3
                              style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: 18,
                                fontWeight: 800,
                                color: '#fff',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                              }}
                            >
                              {event.title}
                            </h3>
                          </div>
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 100,
                            padding: '4px 11px',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#fff',
                            letterSpacing: '0.06em',
                            flexShrink: 0,
                          }}
                        >
                          ✓ Going
                        </div>
                      </div>

                      {/* Description */}
                      <p
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 12.5,
                          color: 'rgba(255,255,255,0.78)',
                          lineHeight: 1.55,
                          marginBottom: 14,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {event.description}
                      </p>

                      {/* Footer row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 11,
                            fontWeight: 600,
                            color:
                              event.spotsLeft != null && event.spotsLeft <= 3
                                ? '#ffaa80'
                                : 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {event.spotsLeft == null
                            ? '● Drop in anytime'
                            : event.spotsLeft === 0
                              ? '● Full'
                              : event.spotsLeft <= 3
                                ? `● Only ${event.spotsLeft} spots left!`
                                : `● ${event.spotsLeft} of ${event.totalSpots} spots left`}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleEvent(event.id)}
                          style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.7)',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 100,
                            padding: '6px 14px',
                            cursor: 'pointer',
                            letterSpacing: '0.03em',
                            backdropFilter: 'blur(4px)',
                          }}
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

        <ProfileOrderHistorySection
          isAuthenticated={isAuthenticated}
          ordersLoading={ordersLoading}
          completedOrders={completedOrders}
          ordersHorizon={ordersHorizon}
          setOrdersHorizon={setOrdersHorizon}
          filteredCompletedOrders={filteredCompletedOrders}
          paginatedCompletedOrders={paginatedCompletedOrders}
          expandedOrder={expandedOrder}
          setExpandedOrder={setExpandedOrder}
          ordersPage={ordersPage}
          setOrdersPage={setOrdersPage}
          ordersPageCount={ordersPageCount}
        />
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
                  style={{
                    background: 'linear-gradient(148deg, #fef9f0, #f5ead8)',
                    border: '1.5px solid #e0d0b0',
                    borderRadius: 20,
                    padding: '18px 18px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'linear-gradient(145deg, #e8e0d0, #d4c8b0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {event.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}
                      >
                        <p
                          style={{
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#1a2e1a',
                          }}
                        >
                          {event.title}
                        </p>
                        <span
                          style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#7a9a78',
                            background: '#d4e8d0',
                            padding: '2px 8px',
                            borderRadius: 100,
                            flexShrink: 0,
                          }}
                        >
                          ✓ Attended
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 11,
                          color: 'rgba(26,46,26,0.45)',
                        }}
                      >
                        {event.date}
                        {event.time ? ` · ${event.time}` : ''}
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 12.5,
                      color: 'rgba(26,46,26,0.65)',
                      lineHeight: 1.55,
                      marginBottom: 14,
                    }}
                  >
                    {event.description}
                  </p>

                  <div style={{ height: 1, background: 'rgba(26,46,26,0.08)', marginBottom: 12 }} />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        color: ratings[event.id] ? '#c8902a' : 'rgba(26,46,26,0.4)',
                        letterSpacing: '0.02em',
                      }}
                    >
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
