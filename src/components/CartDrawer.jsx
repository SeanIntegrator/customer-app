import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import { useLoyalty } from '../context/LoyaltyContext';
import {
  computeRewardDiscountPenceForCart,
} from '../lib/loyaltyDiscount';
import { loadStripe } from '@stripe/stripe-js';
import {
  createCheckoutSession,
  createIncrementalCheckoutSession,
  fetchCustomerOrder,
  orderLineItemsFromCartItems,
  updateCustomerOrder,
} from '../lib/api';
import OrderSuccess from './OrderSuccess';
import SignInButton from './SignInButton';
import {
  PAPER_GRAIN_BACKGROUND,
  PICKUP_MIN_PICKUP,
  PICKUP_STEP,
  DEFAULT_PICKUP_MINUTES,
  adjustPickupStepper,
  checkoutStepperButtonStyle,
  formatPickupTimeWithAtPrefix,
} from '../lib/pickup';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';
import { previewStampsEarnedForOrderTotal, penceNeededForNextStamp } from '../lib/loyaltyStampPreview';
import { useSheetSwipeToClose } from '../lib/useSheetSwipeToClose';
import { useRewardPricing } from './cart/useRewardPricing';

const stepperBtn = checkoutStepperButtonStyle;

function lineMetaCaption(item) {
  return (
    [
      item.size !== 'Regular' && item.size,
      !['Full Fat', 'Regular'].includes(item.milk) && item.milk,
      item.syrup,
      ...(item.alterations ?? []),
    ].filter(Boolean).join(', ') ||
    ((item.showDrinkModifiers ?? item.showCoffeeOptions) ? 'Regular' : null)
  );
}

const sectionLabelStyle = {
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(26,46,26,0.45)',
  margin: '0 0 8px',
};

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export default function CartDrawer({ open, onClose, onEditLine, orderModifyLocked = false }) {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    clearCart,
    subtotal,
    setActiveOrder,
    activeOrder,
    editOrderId,
    clearEditMode,
    registerPendingKdsFeedback,
    addingToOrderId,
    clearAddingToOrder,
    applyReward,
    setApplyReward,
  } = useCart();
  const { user, isAuthenticated, authFetch } = useAuth();
  const { loyalty: loyaltyConfig, reward } = useAppConfig();
  const { rewardsAvailable } = useLoyalty();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessVariant, setOrderSuccessVariant] = useState('placed');
  const [orderSuccessStampTotalPence, setOrderSuccessStampTotalPence] = useState(null);
  const [pickupMinutes, setPickupMinutes] = useState(DEFAULT_PICKUP_MINUTES);
  const [showCheckoutSignIn, setShowCheckoutSignIn] = useState(false);
  const [lockedOrder, setLockedOrder] = useState(null);

  useEffect(() => {
    if (isAuthenticated) setShowCheckoutSignIn(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open || addingToOrderId == null || !isAuthenticated) {
      setLockedOrder(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const o = await fetchCustomerOrder(authFetch, addingToOrderId);
        if (!cancelled) setLockedOrder(o);
      } catch {
        if (!cancelled) setLockedOrder(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, addingToOrderId, isAuthenticated, authFetch]);

  useEffect(() => {
    if (!open) {
      setOrderSuccess(false);
      setOrderSuccessVariant('placed');
      setOrderSuccessStampTotalPence(null);
    }
  }, [open]);

  const isUpdateEditMode = editOrderId != null && addingToOrderId == null;
  const basketLocked =
    orderModifyLocked && (editOrderId != null || addingToOrderId != null);
  /** Block quantity / line edit for new basket lines when pickup is too soon. */
  const lineEditsBlocked = (item) =>
    basketLocked && (addingToOrderId != null || !item.fromExistingOrder);
  const tallSheet = !orderSuccess && (editOrderId != null || addingToOrderId != null);
  const existingItems = useMemo(() => items.filter((i) => i.fromExistingOrder), [items]);
  const newItems = useMemo(() => items.filter((i) => !i.fromExistingOrder), [items]);
  const existingSubtotal = useMemo(
    () => existingItems.reduce((s, i) => s + i.totalPrice * i.quantity, 0),
    [existingItems]
  );
  const newSubtotal = useMemo(() => newItems.reduce((s, i) => s + i.totalPrice * i.quantity, 0), [newItems]);

  const isFreshStripeCheckout = addingToOrderId == null && editOrderId == null;
  const { eligibleForReward, rewardDiscountPence } = useRewardPricing({
    isFreshStripeCheckout,
    isAuthenticated,
    rewardsAvailable,
    items,
    applyReward,
    rewardConfig: reward,
    loyaltyConfig,
  });

  useEffect(() => {
    if (!eligibleForReward) setApplyReward(false);
  }, [eligibleForReward, setApplyReward]);

  const cartStampPreviewLine = useMemo(() => {
    if (!isAuthenticated || !isFreshStripeCheckout || items.length === 0) return null;
    const preview = previewStampsEarnedForOrderTotal(subtotal);
    if (preview.stamps === 2) {
      return "You'll earn 2 stamps when you collect this order — Double Stamp Tuesday.";
    }
    if (preview.stamps === 1) {
      return "You'll earn 1 stamp when you collect this order (orders £2+).";
    }
    const need = penceNeededForNextStamp(subtotal);
    if (need <= 0) return null;
    return `Add £${(need / 100).toFixed(2)} to earn a stamp (orders £2+).`;
  }, [isAuthenticated, isFreshStripeCheckout, items.length, subtotal]);

  const STRIPE_MIN_CHECKOUT_PENCE = loyaltyConfig?.stripeMinAmountPence ?? 30;
  const displayTotalPence = useMemo(() => {
    if (isFreshStripeCheckout && applyReward && rewardDiscountPence > 0) {
      return Math.max(0, subtotal - rewardDiscountPence);
    }
    return subtotal;
  }, [isFreshStripeCheckout, applyReward, rewardDiscountPence, subtotal]);

  const rewardBelowStripeMin =
    Boolean(applyReward && eligibleForReward && rewardDiscountPence > 0) &&
    displayTotalPence > 0 &&
    displayTotalPence < STRIPE_MIN_CHECKOUT_PENCE;

  const handleSheetClose = () => {
    clearAddingToOrder();
    onClose();
  };

  const { sheetMotionProps, onGreenHeaderPointerDown } = useSheetSwipeToClose(handleSheetClose);

  const adjustPickup = (delta) => {
    setPickupMinutes((m) => adjustPickupStepper(m, delta));
  };

  const handlePlaceOrder = async () => {
    if (basketLocked) return;
    if (items.length === 0 || submitting) return;
    if (!isAuthenticated) {
      setShowCheckoutSignIn(true);
      return;
    }
    setSubmitting(true);
    setError(null);

    const allergensPayload = [];

    const orderSnapshot = {
      items: items.map((i) => ({
        name: i.name,
        emoji: i.emoji,
        quantity: i.quantity,
        size: i.size,
        milk: i.milk,
        category: i.category,
        showDrinkModifiers: i.showDrinkModifiers ?? i.showCoffeeOptions,
        totalPrice: i.totalPrice,
      })),
      pickupMinutes,
      total: subtotal,
      placedAt: Date.now(),
    };

    try {
      if (addingToOrderId != null) {
        const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!pubKey) {
          setError('Checkout is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY).');
        } else {
          const { sessionId, url } = await createIncrementalCheckoutSession(authFetch, {
            order_id: addingToOrderId,
            additional_line_items: orderLineItemsFromCartItems(items),
          });
          const stripe = await loadStripe(pubKey);
          if (!stripe) {
            throw new Error('Stripe.js failed to load');
          }
          const { error: stripeErr } = await stripe.redirectToCheckout({ sessionId });
          if (stripeErr) {
            if (url) {
              window.location.assign(url);
              return;
            }
            throw new Error(stripeErr.message || 'Could not redirect to payment');
          }
        }
      } else if (editOrderId != null) {
        setOrderSuccessVariant('updated');
        const updated = await updateCustomerOrder(authFetch, editOrderId, {
          customer_name: user.displayName,
          note: null,
          allergens: allergensPayload,
          pickup_minutes: pickupMinutes,
          line_items: orderLineItemsFromCartItems(items),
        });
        setOrderSuccessStampTotalPence(Number(updated.total_amount) || 0);
        setActiveOrder({
          ...orderSnapshot,
          orderId: updated.id,
          dbOrderId: updated.id,
          squareOrderId: updated.square_order_id,
        });
        clearEditMode();
        clearCart();
        setOrderSuccess(true);
      } else {
        setOrderSuccessVariant('placed');
        const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!pubKey) {
          setError('Checkout is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY).');
        } else {
          if (applyReward && rewardBelowStripeMin) {
            setError(
              `Total after reward must be at least £${(STRIPE_MIN_CHECKOUT_PENCE / 100).toFixed(2)}. Add another item or turn the reward off.`
            );
            setSubmitting(false);
            return;
          }
          const { sessionId, url } = await createCheckoutSession(authFetch, {
            line_items: orderLineItemsFromCartItems(items),
            customer_name: user.displayName,
            pickup_minutes: pickupMinutes,
            allergens: allergensPayload,
            apply_reward: Boolean(applyReward && eligibleForReward && !rewardBelowStripeMin),
          });
          const stripe = await loadStripe(pubKey);
          if (!stripe) {
            throw new Error('Stripe.js failed to load');
          }
          const { error: stripeErr } = await stripe.redirectToCheckout({ sessionId });
          if (stripeErr) {
            if (url) {
              window.location.assign(url);
              return;
            }
            throw new Error(stripeErr.message || 'Could not redirect to payment');
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    if (
      (orderSuccessVariant === 'placed' || orderSuccessVariant === 'updated') &&
      activeOrder?.dbOrderId != null &&
      activeOrder?.squareOrderId
    ) {
      registerPendingKdsFeedback({
        dbOrderId: activeOrder.dbOrderId,
        squareOrderId: activeOrder.squareOrderId,
      });
    }
    handleSheetClose();
    setPickupMinutes(DEFAULT_PICKUP_MINUTES);
    navigate('/');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !orderSuccess && handleSheetClose()}
            className="fixed inset-0 sheet-backdrop z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
            className={`fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 flex flex-col ${orderSuccess ? 'h-[70vh]' : tallSheet ? 'h-[90vh] max-h-[90vh]' : 'min-h-[75vh] max-h-[90vh]'}`}
            style={{ background: '#f0e6d0', overflow: 'hidden' }}
            {...sheetMotionProps}
          >
            {orderSuccess ? (
              <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div
                  role="presentation"
                  aria-hidden
                  onPointerDown={onGreenHeaderPointerDown}
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
                <OrderSuccess
                  variant={orderSuccessVariant}
                  onDone={handleSuccessDone}
                  pickupMinutes={pickupMinutes}
                  stampPreviewTotalPence={orderSuccessStampTotalPence ?? undefined}
                />
              </div>
            ) : (
              <>
                <div
                  className="flex-shrink-0"
                  onPointerDown={onGreenHeaderPointerDown}
                  style={{
                    background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    touchAction: 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: PAPER_GRAIN_BACKGROUND,
                    backgroundRepeat: 'repeat',
                    pointerEvents: 'none',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 2, position: 'relative' }}>
                    <div style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }} />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 20px 16px',
                    position: 'relative',
                  }}>
                    <h2 style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#f0e6d0',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}>
                      {addingToOrderId != null ? 'Add to order' : editOrderId != null ? 'Update order' : 'Your order'}
                    </h2>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={handleSheetClose}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(240,230,208,0.15)',
                        border: '1.5px solid rgba(240,230,208,0.2)',
                        color: '#f0e6d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {basketLocked ? (
                  <div
                    role="status"
                    className="flex-shrink-0"
                    style={{
                      padding: '12px 20px',
                      background: 'rgba(179, 74, 42, 0.1)',
                      borderBottom: '1px solid rgba(179, 74, 42, 0.22)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#5c2e22',
                        margin: 0,
                        lineHeight: 1.45,
                        textAlign: 'center',
                      }}
                    >
                      It is too close to your pickup time to edit your order.
                    </p>
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0" style={{ padding: '12px 20px' }}>
                  {isUpdateEditMode ? (
                    <>
                      <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Already on your order</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                        {existingItems.map((item) => (
                          <motion.div
                            key={item.cartId}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              opacity: 0.75,
                              background: '#e4dfd4',
                              border: '1.5px solid rgba(26,46,26,0.16)',
                              borderRadius: 18,
                              padding: '14px 16px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontFamily: 'Fraunces, Georgia, serif',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: 'rgba(26,46,26,0.75)',
                                  lineHeight: 1.3,
                                  margin: 0,
                                }}
                              >
                                {item.quantity > 1 ? `${item.quantity}× ` : ''}
                                {item.name}
                              </p>
                              <p
                                style={{
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: 11,
                                  color: 'rgba(26,46,26,0.4)',
                                  margin: '4px 0 0',
                                }}
                              >
                                {lineMetaCaption(item)}
                              </p>
                              {item.customerNote ? (
                                <p
                                  style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: 11,
                                    fontStyle: 'italic',
                                    color: 'rgba(26,46,26,0.45)',
                                    margin: '4px 0 0',
                                  }}
                                >
                                  {item.customerNote}
                                </p>
                              ) : null}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p
                                style={{
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: 'rgba(26,46,26,0.55)',
                                  margin: 0,
                                }}
                              >
                                £{((item.totalPrice * item.quantity) / 100).toFixed(2)}
                              </p>
                              <p
                                style={{
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: 10,
                                  color: 'rgba(26,46,26,0.35)',
                                  margin: '4px 0 0',
                                }}
                              >
                                Paid / on order
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Adding to order</p>
                      {newItems.length === 0 ? (
                        <p
                          style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 14,
                            color: 'rgba(26,46,26,0.5)',
                            margin: '0 0 12px',
                            lineHeight: 1.45,
                          }}
                        >
                          Nothing added yet.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {newItems.map((item) => (
                            <motion.div
                              key={item.cartId}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              style={{
                                background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
                                border: '1.5px solid #e0d0b0',
                                borderRadius: 18,
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                              }}
                            >
                              <span style={{ fontSize: 30, flexShrink: 0 }}>{item.emoji}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontFamily: 'Fraunces, Georgia, serif',
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: '#1a2e1a',
                                      lineHeight: 1.3,
                                      margin: 0,
                                      flex: 1,
                                      minWidth: 0,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {item.name}
                                  </p>
                                  <button
                                    type="button"
                                    aria-label={`Edit ${item.name}`}
                                    disabled={lineEditsBlocked(item)}
                                    onClick={() => {
                                      if (!lineEditsBlocked(item)) onEditLine?.(item);
                                    }}
                                    style={{
                                      flexShrink: 0,
                                      width: 32,
                                      height: 32,
                                      borderRadius: 10,
                                      border: '1.5px solid #d4c0a0',
                                      background: 'rgba(255,255,255,0.6)',
                                      color: '#1a2e1a',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: lineEditsBlocked(item) ? 'not-allowed' : 'pointer',
                                      opacity: lineEditsBlocked(item) ? 0.4 : 1,
                                    }}
                                  >
                                    <PenIcon />
                                  </button>
                                </div>
                                <p
                                  style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: 11,
                                    color: 'rgba(26,46,26,0.45)',
                                    margin: '4px 0 0',
                                  }}
                                >
                                  {lineMetaCaption(item)}
                                </p>
                                {item.customerNote ? (
                                  <p
                                    style={{
                                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                                      fontSize: 11,
                                      fontStyle: 'italic',
                                      color: 'rgba(26,46,26,0.55)',
                                      margin: '4px 0 0',
                                    }}
                                  >
                                    {item.customerNote}
                                  </p>
                                ) : null}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <button
                                    type="button"
                                    disabled={lineEditsBlocked(item)}
                                    onClick={() => updateQuantity(item.cartId, -1)}
                                    style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
                                  >
                                    −
                                  </button>
                                  <span
                                    style={{
                                      fontFamily: 'Fraunces, Georgia, serif',
                                      fontSize: 15,
                                      fontWeight: 700,
                                      color: '#1a2e1a',
                                      width: 18,
                                      textAlign: 'center',
                                    }}
                                  >
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={lineEditsBlocked(item)}
                                    onClick={() => updateQuantity(item.cartId, 1)}
                                    style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
                                  >
                                    +
                                  </button>
                                </div>
                                <p
                                  style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#c8902a',
                                    margin: 0,
                                  }}
                                >
                                  £{(item.totalPrice / 100).toFixed(2)} ea.
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}

                  {!isUpdateEditMode && addingToOrderId != null ? (
                    <div style={{ marginBottom: 14 }}>
                      <p style={sectionLabelStyle}>
                        Already ordered
                      </p>
                      {!lockedOrder ? (
                        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: 'rgba(26,46,26,0.5)' }}>
                          Loading your order…
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(lockedOrder.items || []).map((it, i) => {
                            const modStr = Array.isArray(it.modifiers)
                              ? it.modifiers.map((m) => (m && typeof m === 'object' ? m.name : m)).filter(Boolean).join(', ')
                              : '';
                            return (
                              <div
                                key={it.id ?? i}
                                style={{
                                  background: 'rgba(255,255,255,0.45)',
                                  border: '1.5px solid #e0d0b0',
                                  borderRadius: 14,
                                  padding: '10px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                }}
                              >
                                <span style={{ fontSize: 22 }}>{it.item_emoji || '☕'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p
                                    style={{
                                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: '#1a2e1a',
                                      margin: 0,
                                    }}
                                  >
                                    {it.quantity > 1 ? `${it.quantity}× ` : ''}
                                    {it.item_name}
                                  </p>
                                  {modStr ? (
                                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.45)', margin: '2px 0 0' }}>
                                      {modStr}
                                    </p>
                                  ) : null}
                                </div>
                                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1a2e1a' }}>
                                  £{((Number(it.unit_price) * Number(it.quantity)) / 100).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {!isUpdateEditMode && addingToOrderId != null ? <p style={{ ...sectionLabelStyle, marginTop: 0 }}>Adding</p> : null}

                  {!isUpdateEditMode && items.length === 0 && addingToOrderId == null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
                      <span style={{ fontSize: 48, marginBottom: 12 }}>🛒</span>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: 'rgba(26,46,26,0.4)' }}>Your cart is empty</p>
                    </div>
                  ) : !isUpdateEditMode && items.length === 0 && addingToOrderId != null ? (
                    <div style={{ textAlign: 'center', padding: '28px 12px 48px' }}>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 700, color: 'rgba(26,46,26,0.55)', margin: 0 }}>
                        Choose items from the menu to add to this order.
                      </p>
                    </div>
                  ) : !isUpdateEditMode && items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map((item) => (
                        <motion.div
                          key={item.cartId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          style={{
                            background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
                            border: '1.5px solid #e0d0b0',
                            borderRadius: 18,
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 30, flexShrink: 0 }}>{item.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                              <p style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#1a2e1a',
                                lineHeight: 1.3,
                                margin: 0,
                                flex: 1,
                                minWidth: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {item.name}
                              </p>
                              <button
                                type="button"
                                aria-label={`Edit ${item.name}`}
                                disabled={lineEditsBlocked(item)}
                                onClick={() => {
                                  if (!lineEditsBlocked(item)) onEditLine?.(item);
                                }}
                                style={{
                                  flexShrink: 0,
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  border: '1.5px solid #d4c0a0',
                                  background: 'rgba(255,255,255,0.6)',
                                  color: '#1a2e1a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: lineEditsBlocked(item) ? 'not-allowed' : 'pointer',
                                  opacity: lineEditsBlocked(item) ? 0.4 : 1,
                                }}
                              >
                                <PenIcon />
                              </button>
                            </div>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 11,
                              color: 'rgba(26,46,26,0.45)',
                              margin: '4px 0 0',
                            }}>
                              {lineMetaCaption(item)}
                            </p>
                            {item.customerNote ? (
                              <p style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 11,
                                fontStyle: 'italic',
                                color: 'rgba(26,46,26,0.55)',
                                margin: '4px 0 0',
                              }}>
                                {item.customerNote}
                              </p>
                            ) : null}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                type="button"
                                disabled={lineEditsBlocked(item)}
                                onClick={() => updateQuantity(item.cartId, -1)}
                                style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
                              >
                                −
                              </button>
                              <span style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#1a2e1a',
                                width: 18,
                                textAlign: 'center',
                              }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={lineEditsBlocked(item)}
                                onClick={() => updateQuantity(item.cartId, 1)}
                                style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
                              >
                                +
                              </button>
                            </div>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#c8902a',
                              margin: 0,
                            }}>
                              £{(item.totalPrice / 100).toFixed(2)} ea.
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : null}

                  {cartStampPreviewLine ? (
                    <p
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'rgba(26,46,26,0.48)',
                        margin: '14px 0 4px',
                        lineHeight: 1.45,
                      }}
                    >
                      {cartStampPreviewLine}
                    </p>
                  ) : null}
                </div>

                {items.length > 0 && (
                  <div
                    className="flex-shrink-0"
                    style={{
                      borderTop: '1px solid rgba(26,46,26,0.1)',
                      background: '#f0e6d0',
                      padding: '16px 20px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {showCheckoutSignIn && (
                      <div
                        style={{
                          textAlign: 'center',
                          background: 'rgba(26,46,26,0.06)',
                          borderRadius: 16,
                          padding: '14px 16px',
                          border: '1.5px solid #d4c0a0',
                        }}
                      >
                        <p
                          style={{
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#1a2e1a',
                            margin: '0 0 10px',
                          }}
                        >
                          Sign in to place your order
                        </p>
                        <SignInButton
                          style={{ display: 'flex', justifyContent: 'center' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCheckoutSignIn(false)}
                          style={{
                            marginTop: 10,
                            background: 'none',
                            border: 'none',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(26,46,26,0.45)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          Close
                        </button>
                      </div>
                    )}

                    {error && (
                      <p style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13,
                        color: '#b34a2a',
                        textAlign: 'center',
                        background: 'rgba(179,74,42,0.08)',
                        borderRadius: 12,
                        padding: '8px 16px',
                        margin: 0,
                      }}>
                        {error}
                      </p>
                    )}

                    {isUpdateEditMode ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(26,46,26,0.5)',
                          }}>
                            Already ordered
                          </span>
                          <span style={{
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 18,
                            fontWeight: 800,
                            color: 'rgba(26,46,26,0.65)',
                          }}>
                            £{(existingSubtotal / 100).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(26,46,26,0.5)',
                          }}>
                            New items
                          </span>
                          <span style={{
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 18,
                            fontWeight: 800,
                            color: '#1a2e1a',
                          }}>
                            £{(newSubtotal / 100).toFixed(2)}
                          </span>
                        </div>
                        
                      </>
                    ) : null}

                    {eligibleForReward ? (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          background: 'rgba(200,144,42,0.08)',
                          border: '1.5px solid rgba(200,144,42,0.25)',
                          borderRadius: 16,
                          padding: '12px 16px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#1a2e1a',
                            margin: 0,
                          }}>
                            Use free drink reward
                          </p>
                          <p style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 11,
                            color: 'rgba(26,46,26,0.5)',
                            margin: '4px 0 0',
                            lineHeight: 1.35,
                          }}>
                            Up to £
                            {(
                              computeRewardDiscountPenceForCart(
                                items,
                                loyaltyConfig?.rewardMaxPence,
                                reward?.drinkCategorySlugs
                              ) / 100
                            ).toFixed(2)}{' '}
                            off your cheapest drink
                            {rewardBelowStripeMin && applyReward
                              ? ` — add items so the total stays above £${(STRIPE_MIN_CHECKOUT_PENCE / 100).toFixed(2)}.`
                              : ''}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={applyReward}
                          onChange={() => setApplyReward((v) => !v)}
                          style={{ width: 22, height: 22, accentColor: '#1a2e1a', flexShrink: 0 }}
                        />
                      </label>
                    ) : null}

                    {applyReward && rewardDiscountPence > 0 && eligibleForReward ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'rgba(26,46,26,0.5)',
                        }}>
                          Free drink reward
                        </span>
                        <span style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#2d6b2d',
                        }}>
                          −£{(rewardDiscountPence / 100).toFixed(2)}
                        </span>
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(26,46,26,0.45)',
                      }}>
                        {addingToOrderId != null ? 'Add-ons total' : isUpdateEditMode ? 'Order total' : 'Total'}
                      </span>
                      <span style={{
                        fontFamily: 'Fraunces, Georgia, serif',
                        fontSize: 26,
                        fontWeight: 900,
                        color: '#1a2e1a',
                        letterSpacing: '-0.03em',
                      }}>
                        £{(displayTotalPence / 100).toFixed(2)}
                      </span>
                    </div>

                    {addingToOrderId == null ? (
                      <>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.5)',
                          border: '1.5px solid #e0d0b0',
                          borderRadius: 16,
                          padding: '12px 16px',
                        }}>
                          <div>
                            <p style={{
                              fontFamily: 'Fraunces, Georgia, serif',
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#1a2e1a',
                              margin: 0,
                            }}>
                              Pickup time
                            </p>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 12,
                              color: 'rgba(26,46,26,0.45)',
                              margin: '2px 0 0',
                            }}>
                              {formatPickupTimeWithAtPrefix(pickupMinutes)}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                              type="button"
                              onClick={() => adjustPickup(-PICKUP_STEP)}
                              disabled={basketLocked || pickupMinutes === PICKUP_MIN_PICKUP}
                              style={{
                                ...stepperBtn,
                                opacity: basketLocked || pickupMinutes === PICKUP_MIN_PICKUP ? 0.3 : 1,
                              }}
                            >
                              −
                            </button>
                            <span style={{
                              fontFamily: 'Fraunces, Georgia, serif',
                              fontWeight: 700,
                              color: '#1a2e1a',
                              fontSize: 14,
                              width: 40,
                              textAlign: 'center',
                            }}>
                              {pickupMinutes === PICKUP_MIN_PICKUP ? 'ASAP' : `${pickupMinutes}m`}
                            </span>
                            <button
                              type="button"
                              disabled={basketLocked}
                              onClick={() => adjustPickup(PICKUP_STEP)}
                              style={{ ...stepperBtn, opacity: basketLocked ? 0.3 : 1 }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Allergen toggle + chips removed until a robust flow is implemented; checkout sends no allergens. */}
                      </>
                    ) : null}

                    <motion.button
                      whileTap={{ scale: basketLocked || submitting ? 1 : 0.97 }}
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={submitting || basketLocked}
                      style={{
                        width: '100%',
                        background: basketLocked ? 'rgba(26,46,26,0.12)' : CHECKOUT_PRIMARY_GRADIENT,
                        color: basketLocked ? 'rgba(26,46,26,0.35)' : CHECKOUT_PRIMARY_TEXT,
                        borderRadius: 22,
                        padding: '18px 24px',
                        border: 'none',
                        cursor: submitting || basketLocked ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: submitting ? 0.6 : 1,
                        boxShadow: basketLocked ? 'none' : CHECKOUT_PRIMARY_SHADOW,
                      }}
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            {addingToOrderId != null ? 'Opening checkout…' : 'Placing order…'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                          {addingToOrderId != null ? 'Pay for new items' : editOrderId != null ? 'Save changes' : 'Place order'}
                        </span>
                      )}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
