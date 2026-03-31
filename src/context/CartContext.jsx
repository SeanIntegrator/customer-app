import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [items, setItems] = useState([]);
  const [orderAllergens, setOrderAllergens] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  /** Pay for add-ons: target DB order id; cart holds only new lines. */
  const [addingToOrderId, setAddingToOrderId] = useState(null);
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

  const editOrderIdRef = useRef(null);
  const addingToOrderIdRef = useRef(null);
  editOrderIdRef.current = editOrderId;
  addingToOrderIdRef.current = addingToOrderId;

  const applyKdsOrderCompleted = useCallback(
    (payload) => {
      const incomingDb = payload?.dbOrderId;
      const sq = payload?.squareOrderId != null ? String(payload.squareOrderId) : '';

      setActiveOrder((prev) => {
        if (!prev) return prev;
        const prevDb = prev.dbOrderId ?? prev.orderId;
        const matchDb = incomingDb != null && prevDb != null && Number(prevDb) === Number(incomingDb);
        const matchSq =
          sq !== '' &&
          prev.squareOrderId != null &&
          String(prev.squareOrderId) === sq;
        if (matchDb || matchSq) return null;
        return prev;
      });

      const list = pendingKdsFeedbackRef.current;
      const idx = list.findIndex(
        (o) =>
          (incomingDb != null && Number(o.dbOrderId) === Number(incomingDb)) ||
          (sq !== '' && o.squareOrderId === sq)
      );

      let feedbackOrderId = null;
      if (idx !== -1) {
        const [hit] = list.splice(idx, 1);
        feedbackOrderId = hit.dbOrderId;
      }

      if (incomingDb != null) {
        const dbN = Number(incomingDb);
        const ed = editOrderIdRef.current;
        const ad = addingToOrderIdRef.current;
        if (ed != null && Number(ed) === dbN) {
          setEditOrderId(null);
          setItems([]);
          setOrderAllergens([]);
          if (feedbackOrderId == null) feedbackOrderId = dbN;
        }
        if (ad != null && Number(ad) === dbN) {
          setAddingToOrderId(null);
          setItems([]);
          setOrderAllergens([]);
          if (feedbackOrderId == null) feedbackOrderId = dbN;
        }
      }

      if (feedbackOrderId != null) {
        beginPostCheckoutFeedback(feedbackOrderId);
      }
    },
    [beginPostCheckoutFeedback]
  );

  const lineDedupeKey = useCallback((i) => {
    const altKey = (x) => (x.alterations ?? []).slice().sort().join(',');
    const note = (i.customerNote ?? '').trim();
    return `${i.catalogObjectId}|${i.size}|${i.milk}|${i.syrup ?? 'none'}|${altKey(i)}|${note}`;
  }, []);

  const addItem = useCallback(
    (item) => {
      setItems((prev) => {
        const key = lineDedupeKey(item);
        const existing = prev.find((i) => lineDedupeKey(i) === key);
        if (existing) {
          return prev.map((i) =>
            lineDedupeKey(i) === key
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
    },
    [lineDedupeKey]
  );

  const removeItem = useCallback((cartId) => {
    setItems((prev) => prev.filter((i) => i.cartId !== cartId || i.fromExistingOrder));
  }, []);

  const updateQuantity = useCallback((cartId, delta) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.cartId !== cartId) return i;
          if (i.fromExistingOrder) return i;
          return { ...i, quantity: i.quantity + delta };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const updateCartLine = useCallback((cartId, updates) => {
    setItems((prev) =>
      prev.map((i) => (i.cartId === cartId && !i.fromExistingOrder ? { ...i, ...updates } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setOrderAllergens([]);
  }, []);

  /** Pre-fill cart from API order shape; opening menu to add more items before PATCH checkout. */
  const loadCartFromOrderEdit = useCallback((apiOrder) => {
    if (!apiOrder?.id) return;
    setAddingToOrderId(null);
    setEditOrderId(apiOrder.id);
    setOrderAllergens(normalizeAllergensFromApi(apiOrder.allergens));
    setItems(
      (apiOrder.items || []).map((it, idx) => {
        const nm = (it.item_name || '').toLowerCase();
        const showCoffeeOptions = [
          'coffee', 'latte', 'tea', 'matcha', 'chai', 'mocha', 'cappuccino', 'americano',
          'espresso', 'macchiato', 'flat white', 'hot chocolate', 'chocolate', 'drink',
        ].some((w) => nm.includes(w));
        return {
          cartId: `edit-${it.id}-${idx}`,
          catalogObjectId: it.square_variation_id,
          name: it.item_name,
          emoji: it.item_emoji || '☕',
          category: showCoffeeOptions ? 'coffee' : 'food',
          showCoffeeOptions,
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
  }, []);

  const clearEditMode = useCallback(() => {
    setEditOrderId(null);
    setOrderAllergens([]);
  }, []);

  const startAddingToOrder = useCallback(
    (orderId) => {
      if (orderId == null) return;
      setEditOrderId(null);
      setAddingToOrderId(Number(orderId));
      setItems([]);
      setOrderAllergens([]);
      navigate('/order');
    },
    [navigate]
  );

  const clearAddingToOrder = useCallback(() => {
    setAddingToOrderId(null);
  }, []);

  /** Replace cart with lines (e.g. usual order); clears edit mode. */
  const replaceCartLines = useCallback((lines, opts = {}) => {
    setEditOrderId(null);
    setAddingToOrderId(null);
    setOrderAllergens(Array.isArray(opts.allergens) ? opts.allergens : []);
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
