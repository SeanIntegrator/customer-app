import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENTS, PAST_EVENTS, PROMOTIONS } from '../data/mock';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { initialsFromName, formatMemberSince } from '../lib/userDisplay';
import { remainingMinutesUntilPickup } from '../lib/pickup';
import EditOrderModal from '../components/EditOrderModal';
import CancellationModal from '../components/CancellationModal';
import OrderCancelledSuccess from '../components/OrderCancelledSuccess';
import { fetchCustomerOrders, fetchCustomerOrder } from '../lib/api';
import HomeHero from '../components/home/HomeHero';
import HomeBridgingCta from '../components/home/HomeBridgingCta';
import HomeEventsSection from '../components/home/HomeEventsSection';
import HomeEventSignInModal from '../components/home/HomeEventSignInModal';
import QRModal from '../components/home/QRModal';
import { getCafeSocket } from '../lib/cafeSocket';
import { unpaidBasketQuantity } from '../lib/basketUnpaidQty';

export default function Home() {
  const navigate = useNavigate();
  const {
    activeOrder,
    items: cartItems,
    editOrderId,
    addingToOrderId,
    loadCartFromOrderEdit,
    startAddingToOrder,
    clearActiveOrder,
    setSuppressNavBasketForPaidGoldCard,
  } = useCart();
  const activeOrderRef = useRef(activeOrder);
  activeOrderRef.current = activeOrder;
  const { user, loading: authLoading, isAuthenticated, authFetch } = useAuth();
  const loyalty = useLoyalty();
  const [events, setEvents] = useState(EVENTS);
  const [showPast, setShowPast] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEventSignIn, setShowEventSignIn] = useState(false);
  const [serverLiveOrder, setServerLiveOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState({ open: false, refundedPence: 0 });

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
  const clearActiveOrderRef = useRef(clearActiveOrder);
  clearActiveOrderRef.current = clearActiveOrder;
  const refreshLoyaltyRef = useRef(loyalty.refreshAfterOrder);
  refreshLoyaltyRef.current = loyalty.refreshAfterOrder;

  useEffect(() => {
    const socket = getCafeSocket();
    if (!socket) return undefined;

    const onOrderCancelled = (payload) => {
      const dbId = payload?.dbOrderId;
      if (dbId == null) return;
      const cur = serverLiveOrderRef.current;
      const ao = activeOrderRef.current;
      const matchSrv = cur != null && Number(cur.id) === Number(dbId);
      const aoId = ao?.dbOrderId ?? ao?.orderId;
      const matchAo = aoId != null && Number(aoId) === Number(dbId);
      if (matchSrv || matchAo) {
        clearActiveOrderRef.current();
        if (matchSrv) setServerLiveOrder(null);
        refreshLiveOrderRef.current();
      }
    };

    const onKdsCompleted = (payload) => {
      const db = payload?.dbOrderId;
      const sq = payload?.squareOrderId != null ? String(payload.squareOrderId) : '';
      const cur = serverLiveOrderRef.current;
      const ao = activeOrderRef.current;

      const matchServer =
        cur != null &&
        ((db != null && Number(cur.id) === Number(db)) ||
          (sq !== '' && String(cur.square_order_id ?? '') === sq));
      const aoId = ao?.dbOrderId ?? ao?.orderId;
      const matchActive =
        ao != null &&
        aoId != null &&
        ((db != null && Number(aoId) === Number(db)) ||
          (sq !== '' && ao.squareOrderId != null && String(ao.squareOrderId) === sq));

      if (matchServer || matchActive) refreshLiveOrderRef.current();
      refreshLoyaltyRef.current();
    };

    socket.on('customerOrderCompleted', onKdsCompleted);
    socket.on('orderCancelled', onOrderCancelled);
    return () => {
      socket.off('customerOrderCompleted', onKdsCompleted);
      socket.off('orderCancelled', onOrderCancelled);
    };
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
        is_paid_via_stripe: Boolean(serverLiveOrder.is_paid_via_stripe),
      };
    }
    if (activeOrder && (activeOrder.orderId != null || activeOrder.dbOrderId != null)) {
      const id = activeOrder.dbOrderId ?? activeOrder.orderId;
      const at = Number(activeOrder.total);
      return {
        id,
        status: 'confirmed',
        total_amount: Number.isFinite(at) ? at : 0,
        pickupMinutes: activeOrder.pickupMinutes ?? 10,
        items: activeOrder.items || [],
        editable: true,
        is_paid_via_stripe: true,
      };
    }
    return null;
  })();

  const bridgingCtaLoading =
    (isAuthenticated && (authLoading || ordersLoading) && !goldCardModel) ||
    (authLoading && hasAuthToken && !goldCardModel);

  useEffect(() => {
    setSuppressNavBasketForPaidGoldCard(
      Boolean(goldCardModel?.is_paid_via_stripe && addingToOrderId == null)
    );
    return () => setSuppressNavBasketForPaidGoldCard(false);
  }, [goldCardModel?.is_paid_via_stripe, addingToOrderId, setSuppressNavBasketForPaidGoldCard]);

  const basketUnpaidQty = unpaidBasketQuantity(cartItems, editOrderId, addingToOrderId);

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
        loyaltyStamps={isAuthenticated ? loyalty.stampsCount : 0}
        loyaltyGoal={loyalty.stampsGoal}
        loyaltyStampsToNext={isAuthenticated ? loyalty.stampsToNextReward : loyalty.stampsGoal}
        loyaltyRewardsAvailable={isAuthenticated ? loyalty.rewardsAvailable : 0}
        loyaltyLoading={Boolean(isAuthenticated && loyalty.loading)}
        isAuthenticated={isAuthenticated}
        hidePromotionalChips={goldCardModel != null && !bridgingCtaLoading}
        orderCount={isAuthenticated ? user?.orderCount ?? 0 : null}
        memberSinceLabel={isAuthenticated && user?.createdAt ? formatMemberSince(user.createdAt) : null}
        pastEventsCount={PAST_EVENTS.length}
        registeredEventsCount={registeredEvents.length}
      />

      <HomeBridgingCta
        bridgingCtaLoading={bridgingCtaLoading}
        goldCardModel={goldCardModel}
        basketUnpaidQty={basketUnpaidQty}
        navigate={navigate}
        onEditOrderTap={(id) => {
          setEditingOrderId(id);
          setEditOrderOpen(true);
        }}
        onAddMoreTap={async () => {
          if (goldCardModel?.id == null) return;
          try {
            if (goldCardModel.is_paid_via_stripe) {
              startAddingToOrder(goldCardModel.id);
              return;
            }
            const o = await fetchCustomerOrder(authFetch, goldCardModel.id);
            loadCartFromOrderEdit(o);
            navigate('/order');
          } catch (e) {
            console.error(e);
          }
        }}
        onCancelTap={() => setCancelModalOpen(true)}
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
            stamps={isAuthenticated ? loyalty.stampsCount : 0}
            memberSubline={
              isAuthenticated
                ? user?.createdAt
                  ? `Loyalty · Member since ${formatMemberSince(user.createdAt)}`
                  : 'Your Clay & Bean loyalty card'
                : 'Sign in to save your stamp card'
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
            if (o.is_paid_via_stripe) {
              startAddingToOrder(editingOrderId);
            } else {
              loadCartFromOrderEdit(o);
            }
            setEditOrderOpen(false);
            setEditingOrderId(null);
            navigate('/order');
          } catch (e) {
            console.error(e);
          }
        }}
      />

      <CancellationModal
        open={cancelModalOpen && goldCardModel != null}
        onClose={() => setCancelModalOpen(false)}
        authFetch={authFetch}
        order={
          goldCardModel
            ? {
                id: goldCardModel.id,
                total_amount: goldCardModel.total_amount,
              }
            : null
        }
        onCancelled={async (data, cancelledOrderId) => {
          clearActiveOrder();
          if (cancelledOrderId != null) {
            setServerLiveOrder((prev) =>
              prev != null && Number(prev.id) === Number(cancelledOrderId) ? null : prev
            );
          }
          await refreshLiveOrder();
          const pence = data?.refunded_amount;
          if (pence != null && Number.isFinite(Number(pence))) {
            setCancelSuccess({ open: true, refundedPence: Number(pence) });
          }
        }}
      />

      <AnimatePresence>
        {cancelSuccess.open && (
          <>
            <motion.div
              key="cancel-success-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setCancelSuccess({ open: false, refundedPence: 0 });
                navigate('/');
              }}
              className="fixed inset-0 sheet-backdrop z-[200]"
            />
            <motion.div
              key="cancel-success-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-[210] h-[70vh] flex flex-col"
              style={{ background: '#f0e6d0', overflow: 'hidden' }}
            >
              <OrderCancelledSuccess
                refundedAmountPence={cancelSuccess.refundedPence}
                onDone={() => {
                  setCancelSuccess({ open: false, refundedPence: 0 });
                  navigate('/');
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
