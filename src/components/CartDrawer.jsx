import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { redirectToCheckoutWithFallback } from '../lib/stripeCheckout';
import {
  createCheckoutSession,
  createIncrementalCheckoutSession,
  fetchCustomerOrder,
  orderLineItemsFromCartItems,
  updateCustomerOrder,
} from '../lib/api';
import CartDrawerHeader from './cart/CartDrawerHeader';
import CartDrawerSuccessPane from './cart/CartDrawerSuccessPane';
import CartDrawerScrollBody from './cart/CartDrawerScrollBody';
import CartDrawerCheckoutFooter from './cart/CartDrawerCheckoutFooter';
import { DEFAULT_PICKUP_MINUTES, adjustPickupStepper } from '../lib/pickup';
import { previewStampsEarnedForOrderTotal, penceNeededForNextStamp } from '../lib/loyaltyStampPreview';
import { useSheetSwipeToClose } from '../lib/useSheetSwipeToClose';
import { useRewardPricing } from './cart/useRewardPricing';

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
          await redirectToCheckoutWithFallback({ publishableKey: pubKey, sessionId, url });
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
          await redirectToCheckoutWithFallback({ publishableKey: pubKey, sessionId, url });
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
              <CartDrawerSuccessPane
                orderSuccessVariant={orderSuccessVariant}
                onDone={handleSuccessDone}
                pickupMinutes={pickupMinutes}
                orderSuccessStampTotalPence={orderSuccessStampTotalPence}
                onGreenHeaderPointerDown={onGreenHeaderPointerDown}
              />
            ) : (
              <>
                <CartDrawerHeader
                  title={addingToOrderId != null ? 'Add to order' : editOrderId != null ? 'Update order' : 'Your order'}
                  onClose={handleSheetClose}
                  onGreenHeaderPointerDown={onGreenHeaderPointerDown}
                />

                <CartDrawerScrollBody
                  basketLocked={basketLocked}
                  isUpdateEditMode={isUpdateEditMode}
                  existingItems={existingItems}
                  newItems={newItems}
                  lineEditsBlocked={lineEditsBlocked}
                  onEditLine={onEditLine}
                  updateQuantity={updateQuantity}
                  addingToOrderId={addingToOrderId}
                  lockedOrder={lockedOrder}
                  items={items}
                  cartStampPreviewLine={cartStampPreviewLine}
                />
                <CartDrawerCheckoutFooter
                  showCheckoutSignIn={showCheckoutSignIn}
                  setShowCheckoutSignIn={setShowCheckoutSignIn}
                  error={error}
                  isUpdateEditMode={isUpdateEditMode}
                  existingSubtotal={existingSubtotal}
                  newSubtotal={newSubtotal}
                  eligibleForReward={eligibleForReward}
                  reward={reward}
                  loyaltyConfig={loyaltyConfig}
                  items={items}
                  rewardBelowStripeMin={rewardBelowStripeMin}
                  applyReward={applyReward}
                  setApplyReward={setApplyReward}
                  STRIPE_MIN_CHECKOUT_PENCE={STRIPE_MIN_CHECKOUT_PENCE}
                  displayTotalPence={displayTotalPence}
                  addingToOrderId={addingToOrderId}
                  editOrderId={editOrderId}
                  basketLocked={basketLocked}
                  pickupMinutes={pickupMinutes}
                  adjustPickup={adjustPickup}
                  handlePlaceOrder={handlePlaceOrder}
                  submitting={submitting}
                />
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
