import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

function apiModifiersToAlterationNames(mods) {
  if (!Array.isArray(mods)) return [];
  return mods.map((m) => (m && typeof m === 'object' ? m.name : m)).filter(Boolean);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  const clearActiveOrder = useCallback(() => setActiveOrder(null), []);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const altKey = (i) => (i.alterations ?? []).slice().sort().join(',');
      const key = `${item.catalogObjectId}|${item.size}|${item.milk}|${item.syrup ?? 'none'}|${altKey(item)}`;
      const existing = prev.find((i) => `${i.catalogObjectId}|${i.size}|${i.milk}|${i.syrup ?? 'none'}|${altKey(i)}` === key);
      if (existing) {
        return prev.map((i) =>
          `${i.catalogObjectId}|${i.size}|${i.milk}|${i.syrup ?? 'none'}|${altKey(i)}` === key
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
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
      }))
    );
  }, []);

  const clearEditMode = useCallback(() => {
    setEditOrderId(null);
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
