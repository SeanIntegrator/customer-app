import { createContext, useContext, useState, useCallback, useRef } from 'react';

const CartContext = createContext(null);

function apiModifiersToAlterationNames(mods) {
  if (!Array.isArray(mods)) return [];
  return mods.map((m) => (m && typeof m === 'object' ? m.name : m)).filter(Boolean);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  /** Opens the feedback sheet (after KDS marks the matching order complete). */
  const [postCheckoutFeedbackOrderId, setPostCheckoutFeedbackOrderId] = useState(null);
  /** @type {React.MutableRefObject<{ dbOrderId: number, squareOrderId: string }[]>} */
  const pendingKdsFeedbackRef = useRef([]);
  const clearActiveOrder = useCallback(() => setActiveOrder(null), []);
  const beginPostCheckoutFeedback = useCallback((orderId) => {
    if (orderId == null || orderId === '') return;
    setPostCheckoutFeedbackOrderId(orderId);
  }, []);
  const clearPostCheckoutFeedback = useCallback(() => setPostCheckoutFeedbackOrderId(null), []);

  const registerPendingKdsFeedback = useCallback(({ dbOrderId, squareOrderId }) => {
    if (dbOrderId == null || squareOrderId == null || squareOrderId === '') return;
    pendingKdsFeedbackRef.current.push({
      dbOrderId: Number(dbOrderId),
      squareOrderId: String(squareOrderId),
    });
  }, []);

  const applyKdsOrderCompleted = useCallback(
    (payload) => {
      const incomingDb = payload?.dbOrderId;
      const sq = payload?.squareOrderId != null ? String(payload.squareOrderId) : '';

      setActiveOrder((prev) => {
        if (!prev) return prev;
        const matchDb = incomingDb != null && Number(prev.dbOrderId) === Number(incomingDb);
        const matchSq = sq !== '' && String(prev.squareOrderId) === sq;
        if (matchDb || matchSq) return null;
        return prev;
      });

      const list = pendingKdsFeedbackRef.current;
      const idx = list.findIndex(
        (o) =>
          (incomingDb != null && Number(o.dbOrderId) === Number(incomingDb)) ||
          (sq !== '' && o.squareOrderId === sq)
      );
      if (idx === -1) return;
      const [hit] = list.splice(idx, 1);
      beginPostCheckoutFeedback(hit.dbOrderId);
    },
    [beginPostCheckoutFeedback]
  );

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const altKey = (i) => (i.alterations ?? []).slice().sort().join(',');
      const key = `${item.catalogObjectId}|${item.size}|${item.milk}|${item.syrup ?? 'none'}|${altKey(item)}`;
      const existing = prev.find((i) => `${i.catalogObjectId}|${i.size}|${i.milk}|${i.syrup ?? 'none'}|${altKey(i)}` === key);
      if (existing) {
        return prev.map((i) =>
          `${i.catalogObjectId}|${i.size}|${i.milk}|${i.syrup ?? 'none'}|${altKey(i)}` === key
            ? {
                ...i,
                quantity: i.quantity + (item.quantity ?? 1),
                fromExistingOrder: Boolean(i.fromExistingOrder || item.fromExistingOrder),
              }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1, fromExistingOrder: item.fromExistingOrder ?? false }];
    });
  }, []);

  const removeItem = useCallback((cartId) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  /** Pre-fill cart from API order shape; opening menu to add more items before PATCH checkout. */
  const loadCartFromOrderEdit = useCallback((apiOrder) => {
    if (!apiOrder?.id) return;
    setEditOrderId(apiOrder.id);
    setItems(
      (apiOrder.items || []).map((it, idx) => ({
        cartId: `edit-${it.id}-${idx}`,
        catalogObjectId: it.square_variation_id,
        name: it.item_name,
        emoji: it.item_emoji || '☕',
        category: 'coffee',
        size: 'Regular',
        milk: 'Full Fat',
        syrup: null,
        alterations: apiModifiersToAlterationNames(it.modifiers),
        quantity: it.quantity,
        totalPrice: it.unit_price,
        fromExistingOrder: true,
      }))
    );
  }, []);

  const clearEditMode = useCallback(() => {
    setEditOrderId(null);
  }, []);

  /** Replace cart with lines (e.g. usual order); clears edit mode. */
  const replaceCartLines = useCallback((lines) => {
    setEditOrderId(null);
    setItems(Array.isArray(lines) ? lines : []);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.totalPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        activeOrder,
        setActiveOrder,
        clearActiveOrder,
        editOrderId,
        setEditOrderId,
        loadCartFromOrderEdit,
        clearEditMode,
        replaceCartLines,
        postCheckoutFeedbackOrderId,
        beginPostCheckoutFeedback,
        clearPostCheckoutFeedback,
        registerPendingKdsFeedback,
        applyKdsOrderCompleted,
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
