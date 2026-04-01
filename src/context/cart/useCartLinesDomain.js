import { useCallback, useMemo, useState } from 'react';

function lineDedupeKey(i) {
  const altKey = (x) => (x.alterations ?? []).slice().sort().join(',');
  const note = (i.customerNote ?? '').trim();
  return `${i.catalogObjectId}|${i.size}|${i.milk}|${i.syrup ?? 'none'}|${altKey(i)}|${note}`;
}

export function useCartLinesDomain() {
  const [items, setItems] = useState([]);
  const [orderAllergens, setOrderAllergens] = useState([]);
  const [applyReward, setApplyReward] = useState(false);

  const addItem = useCallback((item) => {
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
      return [
        ...prev,
        { ...item, quantity: item.quantity ?? 1, fromExistingOrder: item.fromExistingOrder ?? false },
      ];
    });
  }, []);

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
    setItems((prev) => prev.map((i) => (i.cartId === cartId && !i.fromExistingOrder ? { ...i, ...updates } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setOrderAllergens([]);
    setApplyReward(false);
  }, []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.totalPrice * i.quantity, 0), [items]);

  return {
    items,
    setItems,
    orderAllergens,
    setOrderAllergens,
    applyReward,
    setApplyReward,
    addItem,
    removeItem,
    updateQuantity,
    updateCartLine,
    clearCart,
    totalItems,
    subtotal,
  };
}
