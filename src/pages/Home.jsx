import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { buildHomeGoldCardModel } from '../lib/orderViewModels';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PROMOTIONS } from '../data/mock';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { initialsFromName, formatMemberSince } from '../lib/userDisplay';
import EditOrderModal from '../components/EditOrderModal';
import CancellationModal from '../components/CancellationModal';
import OrderCancelledSuccess from '../components/OrderCancelledSuccess';
import { fetchCustomerOrders, fetchCustomerOrder } from '../lib/api';
import HomeHero from '../components/home/HomeHero';
import HomeBridgingCta from '../components/home/HomeBridgingCta';
import HomeWhatsOnSection from '../components/home/HomeWhatsOnSection';
import QRModal from '../components/home/QRModal';
import { unpaidBasketQuantity } from '../lib/basketUnpaidQty';
import { previewStampsEarnedForOrderTotal } from '../lib/loyaltyStampPreview';
import { useSheetSwipeToClose } from '../lib/useSheetSwipeToClose';
import { useOrderEvents } from '../context/OrderEventsContext';

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
  const { user, loading: authLoading, isAuthenticated, authFetch, hasStoredToken } = useAuth();
  const { subscribe } = useOrderEvents();
  const loyalty = useLoyalty();
  const [showQR, setShowQR] = useState(false);
  const [serverLiveOrder, setServerLiveOrder] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState({ open: false, refundedPence: 0 });

  const hasAuthToken = hasStoredToken();

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

    const offCompleted = subscribe('customerOrderCompleted', onKdsCompleted);
    const offCancelled = subscribe('orderCancelled', onOrderCancelled);
    return () => {
      offCompleted();
      offCancelled();
    };
  }, [subscribe]);

  const goldCardModel = useMemo(
    () => buildHomeGoldCardModel(serverLiveOrder, activeOrder),
    [serverLiveOrder, activeOrder]
  );

  const pendingStampEarnCount = useMemo(() => {
    const ta = goldCardModel?.total_amount;
    if (ta == null) return 0;
    return previewStampsEarnedForOrderTotal(ta).stamps;
  }, [goldCardModel?.total_amount]);

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
  const heroFirstName =
    isAuthenticated && user ? `${user.displayName.split(/\s+/)[0]}.` : 'Welcome.';
  const profileInitials = user ? initialsFromName(user.displayName) : '?';

  const closeCancelSuccess = useCallback(() => {
    setCancelSuccess({ open: false, refundedPence: 0 });
    navigate('/');
  }, [navigate]);

  const {
    sheetMotionProps: cancelSuccessSheetMotion,
    onGreenHeaderPointerDown: cancelSuccessHeaderDrag,
  } = useSheetSwipeToClose(closeCancelSuccess);

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
        onOpenLoyaltyCard={() => setShowQR(true)}
        loyaltyStamps={isAuthenticated ? loyalty.stampsCount : 0}
        loyaltyGoal={loyalty.stampsGoal}
        loyaltyStampsToNext={isAuthenticated ? loyalty.stampsToNextReward : loyalty.stampsGoal}
        loyaltyRewardsAvailable={isAuthenticated ? loyalty.rewardsAvailable : 0}
        loyaltyLoading={Boolean(isAuthenticated && loyalty.loading)}
        isAuthenticated={isAuthenticated}
        pendingStampEarnCount={
          goldCardModel != null && !bridgingCtaLoading ? pendingStampEarnCount : 0
        }
        hidePromotionalChips={goldCardModel != null && !bridgingCtaLoading}
        orderCount={isAuthenticated ? (user?.orderCount ?? 0) : null}
        memberSinceLabel={
          isAuthenticated && user?.createdAt ? formatMemberSince(user.createdAt) : null
        }
      />

      <div className="app-content w-full">
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
      </div>

      <div className="app-content w-full" style={{ paddingBottom: 56, marginTop: 36 }}>
        <div
          style={{
            background: '#f0e6d0',
            border: '1px solid rgba(26,46,26,0.1)',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0, opacity: 0.85 }} aria-hidden>
            {PROMOTIONS[0].emoji}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 15,
                fontWeight: 700,
                color: 'rgba(26,46,26,0.72)',
                margin: '0 0 4px',
                lineHeight: 1.25,
              }}
            >
              {PROMOTIONS[0].title}
            </p>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(26,46,26,0.55)',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              {PROMOTIONS[0].description}
            </p>
          </div>
        </div>

        <HomeWhatsOnSection />
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
              {...cancelSuccessSheetMotion}
            >
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  role="presentation"
                  aria-hidden
                  onPointerDown={cancelSuccessHeaderDrag}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 96,
                    zIndex: 1,
                    touchAction: 'none',
                  }}
                />
                <OrderCancelledSuccess
                  refundedAmountPence={cancelSuccess.refundedPence}
                  onDone={closeCancelSuccess}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
