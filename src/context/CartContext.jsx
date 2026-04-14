import { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearPersistedCheckoutCart,
  writePersistedCheckoutCart,
} from '../lib/cartLocalStorage';
import { getEnrichedCatalog } from '../lib/catalogEnrich';
import { useCartLinesDomain } from './cart/useCartLinesDomain';
import { useOrderLifecycleDomain } from './cart/useOrderLifecycleDomain';
import { usePostCheckoutFeedbackDomain } from './cart/usePostCheckoutFeedbackDomain';

const CartContext = createContext(null);

function apiModifiersToAlterationNames(mods) {
  if (!Array.isArray(mods)) return [];
  return mods.map((m) => (m && typeof m === 'object' ? m.name : m)).filter(Boolean);
}

function normalizeAllergensFromApi(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

export function CartProvider({ children }) {
  const navigate = useNavigate();
  const cartLines = useCartLinesDomain();
  const orderLifecycle = useOrderLifecycleDomain();
  const feedback = usePostCheckoutFeedbackDomain({
    editOrderId: orderLifecycle.editOrderId,
    addingToOrderId: orderLifecycle.addingToOrderId,
    setEditOrderId: orderLifecycle.setEditOrderId,
    setAddingToOrderId: orderLifecycle.setAddingToOrderId,
    setActiveOrder: orderLifecycle.setActiveOrder,
    setItems: cartLines.setItems,
    setOrderAllergens: cartLines.setOrderAllergens,
  });
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateCartLine,
    clearCart,
    totalItems,
    subtotal,
    orderAllergens,
    setOrderAllergens,
    setItems,
    applyReward,
    setApplyReward,
    pickupMinutes,
    setPickupMinutes,
  } = cartLines;

  const {
    activeOrder,
    setActiveOrder,
    clearActiveOrder,
    editOrderId,
    setEditOrderId,
    addingToOrderId,
    setAddingToOrderId,
    clearAddingToOrder,
    suppressNavBasketForPaidGoldCard,
    setSuppressNavBasketForPaidGoldCard,
  } = orderLifecycle;

  useEffect(() => {
    if (editOrderId != null || addingToOrderId != null) {
      clearPersistedCheckoutCart();
      return;
    }
    writePersistedCheckoutCart({ items, applyReward, pickupMinutes });
  }, [items, applyReward, pickupMinutes, editOrderId, addingToOrderId]);
  const {
    postCheckoutFeedbackOrderId,
    beginPostCheckoutFeedback,
    clearPostCheckoutFeedback,
    registerPendingKdsFeedback,
    applyKdsOrderCompleted,
  } = feedback;

  /** Pre-fill cart from API order shape; opening menu to add more items before PATCH checkout. */
  const loadCartFromOrderEdit = useCallback(
    async (apiOrder) => {
      if (!apiOrder?.id) return;
      clearPersistedCheckoutCart();
      setAddingToOrderId(null);
      setApplyReward(false);
      setEditOrderId(apiOrder.id);
      setOrderAllergens(normalizeAllergensFromApi(apiOrder.allergens));

      let variationById = {};
      try {
        const enriched = await getEnrichedCatalog();
        variationById = enriched.variationById ?? {};
      } catch {
        /* menu lookup optional */
      }

      setItems(
        (apiOrder.items || []).map((it, idx) => {
          const vid = it.square_variation_id;
          const meta = vid && variationById[vid] ? variationById[vid] : null;
          const showDrinkModifiers = meta ? meta.showDrinkModifiers : true;
          const category = meta?.categorySlug ?? 'other';
          return {
            cartId: `edit-${it.id}-${idx}`,
            catalogObjectId: vid,
            name: it.item_name,
            emoji: it.item_emoji || '☕',
            category,
            showDrinkModifiers,
            size: 'Regular',
            milk: 'Full Fat',
            syrup: null,
            alterations: apiModifiersToAlterationNames(it.modifiers),
            quantity: it.quantity,
            totalPrice: it.unit_price,
            fromExistingOrder: true,
            customerNote: it.customer_note != null ? String(it.customer_note) : '',
          };
        })
      );
    },
    [setAddingToOrderId, setApplyReward, setEditOrderId, setOrderAllergens, setItems]
  );

  const clearEditMode = useCallback(() => {
    setEditOrderId(null);
    setOrderAllergens([]);
  }, [setEditOrderId, setOrderAllergens]);

  const startAddingToOrder = useCallback(
    (orderId) => {
      if (orderId == null) return;
      clearPersistedCheckoutCart();
      setEditOrderId(null);
      setApplyReward(false);
      setAddingToOrderId(Number(orderId));
      setItems([]);
      setOrderAllergens([]);
      navigate('/order');
    },
    [setEditOrderId, setApplyReward, setAddingToOrderId, setItems, setOrderAllergens, navigate]
  );

  /** Replace cart with lines (e.g. usual order); clears edit mode. */
  const replaceCartLines = useCallback(
    (lines, opts = {}) => {
      setEditOrderId(null);
      setAddingToOrderId(null);
      setApplyReward(false);
      setOrderAllergens(Array.isArray(opts.allergens) ? opts.allergens : []);
      setItems(Array.isArray(lines) ? lines : []);
    },
    [setEditOrderId, setAddingToOrderId, setApplyReward, setOrderAllergens, setItems]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateCartLine,
      clearCart,
      totalItems,
      subtotal,
      orderAllergens,
      setOrderAllergens,
      activeOrder,
      setActiveOrder,
      clearActiveOrder,
      editOrderId,
      setEditOrderId,
      loadCartFromOrderEdit,
      clearEditMode,
      addingToOrderId,
      startAddingToOrder,
      clearAddingToOrder,
      replaceCartLines,
      postCheckoutFeedbackOrderId,
      beginPostCheckoutFeedback,
      clearPostCheckoutFeedback,
      registerPendingKdsFeedback,
      applyKdsOrderCompleted,
      suppressNavBasketForPaidGoldCard,
      setSuppressNavBasketForPaidGoldCard,
      applyReward,
      setApplyReward,
      pickupMinutes,
      setPickupMinutes,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateCartLine,
      clearCart,
      totalItems,
      subtotal,
      orderAllergens,
      setOrderAllergens,
      activeOrder,
      setActiveOrder,
      clearActiveOrder,
      editOrderId,
      setEditOrderId,
      loadCartFromOrderEdit,
      clearEditMode,
      addingToOrderId,
      startAddingToOrder,
      clearAddingToOrder,
      replaceCartLines,
      postCheckoutFeedbackOrderId,
      beginPostCheckoutFeedback,
      clearPostCheckoutFeedback,
      registerPendingKdsFeedback,
      applyKdsOrderCompleted,
      suppressNavBasketForPaidGoldCard,
      setSuppressNavBasketForPaidGoldCard,
      applyReward,
      setApplyReward,
      pickupMinutes,
      setPickupMinutes,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
