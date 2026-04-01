import { createContext, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    applyReward,
    setApplyReward,
  } = cartLines;
  const {
    activeOrder,
    setActiveOrder,
    clearActiveOrder,
    editOrderId,
    setEditOrderId,
    addingToOrderId,
    suppressNavBasketForPaidGoldCard,
    setSuppressNavBasketForPaidGoldCard,
  } = orderLifecycle;
  const {
    postCheckoutFeedbackOrderId,
    beginPostCheckoutFeedback,
    clearPostCheckoutFeedback,
    registerPendingKdsFeedback,
    applyKdsOrderCompleted,
  } = feedback;

  /** Pre-fill cart from API order shape; opening menu to add more items before PATCH checkout. */
  const loadCartFromOrderEdit = useCallback(async (apiOrder) => {
    if (!apiOrder?.id) return;
    orderLifecycle.setAddingToOrderId(null);
    cartLines.setApplyReward(false);
    orderLifecycle.setEditOrderId(apiOrder.id);
    cartLines.setOrderAllergens(normalizeAllergensFromApi(apiOrder.allergens));

    let variationById = {};
    try {
      const enriched = await getEnrichedCatalog();
      variationById = enriched.variationById ?? {};
    } catch (_) {
      /* menu lookup optional */
    }

    cartLines.setItems(
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
  }, [cartLines, orderLifecycle]);

  const clearEditMode = useCallback(() => {
    orderLifecycle.setEditOrderId(null);
    cartLines.setOrderAllergens([]);
  }, [cartLines, orderLifecycle]);

  const startAddingToOrder = useCallback(
    (orderId) => {
      if (orderId == null) return;
      orderLifecycle.setEditOrderId(null);
      cartLines.setApplyReward(false);
      orderLifecycle.setAddingToOrderId(Number(orderId));
      cartLines.setItems([]);
      cartLines.setOrderAllergens([]);
      navigate('/order');
    },
    [cartLines, navigate, orderLifecycle]
  );

  /** Replace cart with lines (e.g. usual order); clears edit mode. */
  const replaceCartLines = useCallback((lines, opts = {}) => {
    orderLifecycle.setEditOrderId(null);
    orderLifecycle.setAddingToOrderId(null);
    cartLines.setApplyReward(false);
    cartLines.setOrderAllergens(Array.isArray(opts.allergens) ? opts.allergens : []);
    cartLines.setItems(Array.isArray(lines) ? lines : []);
  }, [cartLines, orderLifecycle]);

  return (
    <CartContext.Provider
      value={{
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
        clearAddingToOrder: orderLifecycle.clearAddingToOrder,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
