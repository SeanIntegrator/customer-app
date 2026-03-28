import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_LOYALTY, EVENTS, PAST_EVENTS, PROMOTIONS } from '../data/mock';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { initialsFromName, formatMemberSince } from '../lib/userDisplay';
import { remainingMinutesUntilPickup } from '../lib/pickup';
import EditOrderModal from '../components/EditOrderModal';
import { fetchCustomerOrders, fetchCustomerOrder } from '../lib/api';
import HomeHero from '../components/home/HomeHero';
import HomeBridgingCta from '../components/home/HomeBridgingCta';
import HomeEventsSection from '../components/home/HomeEventsSection';
import HomeEventSignInModal from '../components/home/HomeEventSignInModal';
import QRModal from '../components/home/QRModal';
import { getCafeSocket } from '../lib/cafeSocket';

export default function Home() {
  const navigate = useNavigate();
  const { activeOrder, loadCartFromOrderEdit } = useCart();
  const { user, loading: authLoading, isAuthenticated, authFetch } = useAuth();
  const [events, setEvents] = useState(EVENTS);
  const [showPast, setShowPast] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEventSignIn, setShowEventSignIn] = useState(false);
  const [serverLiveOrder, setServerLiveOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const hasAuthToken =
    typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('auth_token');

  const refreshLiveOrder = useCallback(async () => {
    if (!isAuthenticated) {
      setServerLiveOrder(null);
      setOrdersLoading(false);
      return;
    }
    setOrdersLoading(true);
    try {
      const list = await fetchCustomerOrders(authFetch, { status: 'pending,confirmed' });
      setServerLiveOrder(list[0] ?? null);
    } catch {
      setServerLiveOrder(null);
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated, authFetch]);

  useEffect(() => {
    refreshLiveOrder();
  }, [refreshLiveOrder, activeOrder?.placedAt, activeOrder?.orderId]);

  const serverLiveOrderRef = useRef(serverLiveOrder);
  serverLiveOrderRef.current = serverLiveOrder;
  const refreshLiveOrderRef = useRef(refreshLiveOrder);
  refreshLiveOrderRef.current = refreshLiveOrder;

  useEffect(() => {
    const socket = getCafeSocket();
    if (!socket) return undefined;

    const onKdsCompleted = (payload) => {
      const cur = serverLiveOrderRef.current;
      if (!cur) return;
      const db = payload?.dbOrderId;
      const sq = payload?.squareOrderId != null ? String(payload.squareOrderId) : '';
      const match =
        (db != null && Number(cur.id) === Number(db)) ||
        (sq !== '' && String(cur.square_order_id) === sq);
      if (match) refreshLiveOrderRef.current();
    };

    socket.on('customerOrderCompleted', onKdsCompleted);
    return () => socket.off('customerOrderCompleted', onKdsCompleted);
  }, []);

  const goldCardModel = (() => {
    if (serverLiveOrder) {
      return {
        id: serverLiveOrder.id,
        status: serverLiveOrder.status,
        total_amount: serverLiveOrder.total_amount,
        pickupMinutes: remainingMinutesUntilPickup(serverLiveOrder.pickup_time),
        items: (serverLiveOrder.items || []).map((it) => ({
          name: it.item_name,
          emoji: it.item_emoji || '☕',
          quantity: it.quantity,
          totalPrice: it.unit_price,
          size: 'Regular',
          milk: 'Full Fat',
        })),
        editable: serverLiveOrder.status === 'pending' || serverLiveOrder.status === 'confirmed',
      };
    }
    if (activeOrder && (activeOrder.orderId != null || activeOrder.dbOrderId != null)) {
      const id = activeOrder.dbOrderId ?? activeOrder.orderId;
      return {
        id,
        status: 'confirmed',
        total_amount: activeOrder.total,
        pickupMinutes: activeOrder.pickupMinutes ?? 10,
        items: activeOrder.items || [],
        editable: true,
      };
    }
    return null;
  })();

  const bridgingCtaLoading =
    (isAuthenticated && (authLoading || ordersLoading) && !goldCardModel) ||
    (authLoading && hasAuthToken && !goldCardModel);

  const displayName = user?.displayName ?? 'Guest';
  const heroFirstName = isAuthenticated && user ? `${user.displayName.split(/\s+/)[0]}.` : 'Welcome.';
  const profileInitials = user ? initialsFromName(user.displayName) : '?';

  const toggleEvent = (id) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, registered: !e.registered } : e)));
  };

  const handleEventToggle = (id) => {
    if (!isAuthenticated) {
      setShowEventSignIn(true);
      return;
    }
    toggleEvent(id);
  };

  const promo = PROMOTIONS[0];
  const registeredEvents = events.filter((e) => e.registered);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto scrollbar-hide"
      style={{ background: '#f0e6d0' }}
    >
      <HomeHero
        navigate={navigate}
        user={user}
        profileInitials={profileInitials}
        heroFirstName={heroFirstName}
        onOpenQR={() => setShowQR(true)}
        registeredEvents={registeredEvents}
        promo={promo}
        demoLoyalty={DEMO_LOYALTY}
        hidePromotionalChips={goldCardModel != null && !bridgingCtaLoading}
        orderCount={isAuthenticated ? user?.orderCount ?? 0 : null}
        memberSinceLabel={isAuthenticated && user?.createdAt ? formatMemberSince(user.createdAt) : null}
        pastEventsCount={PAST_EVENTS.length}
        registeredEventsCount={registeredEvents.length}
      />

      <HomeBridgingCta
        bridgingCtaLoading={bridgingCtaLoading}
        goldCardModel={goldCardModel}
        navigate={navigate}
        onEditOrderTap={(id) => {
          setEditingOrderId(id);
          setEditOrderOpen(true);
        }}
      />

      <div style={{ padding: '48px 18px 60px' }}>
        <HomeEventsSection
          events={events}
          pastEvents={PAST_EVENTS}
          showPast={showPast}
          setShowPast={setShowPast}
          onEventToggle={handleEventToggle}
        />
      </div>

      <AnimatePresence>
        {showQR && (
          <QRModal
            onClose={() => setShowQR(false)}
            displayName={displayName}
            initials={profileInitials}
            avatarUrl={user?.avatarUrl}
            stamps={DEMO_LOYALTY.stamps}
            memberSubline={
              isAuthenticated
                ? `Demo loyalty · Member since ${DEMO_LOYALTY.memberSince}`
                : `Sign in to save your card · Demo ${DEMO_LOYALTY.stamps} stamps`
            }
          />
        )}
      </AnimatePresence>

      <HomeEventSignInModal open={showEventSignIn} onClose={() => setShowEventSignIn(false)} />

      <EditOrderModal
        orderId={editingOrderId}
        open={editOrderOpen}
        onClose={() => {
          setEditOrderOpen(false);
          setEditingOrderId(null);
        }}
        authFetch={authFetch}
        onSaved={refreshLiveOrder}
        onAddMoreItems={async () => {
          if (editingOrderId == null) return;
          try {
            const o = await fetchCustomerOrder(authFetch, editingOrderId);
            loadCartFromOrderEdit(o);
            setEditOrderOpen(false);
            setEditingOrderId(null);
            navigate('/order');
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </motion.div>
  );
}
