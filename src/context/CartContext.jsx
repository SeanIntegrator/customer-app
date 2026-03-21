import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const clearActiveOrder = useCallback(() => setActiveOrder(null), []);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      // Match by catalogObjectId + size + milk
      const key = `${item.catalogObjectId}|${item.size}|${item.milk}`;
      const existing = prev.find((i) => `${i.catalogObjectId}|${i.size}|${i.milk}` === key);
      if (existing) {
        return prev.map((i) =>
          `${i.catalogObjectId}|${i.size}|${i.milk}` === key
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

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.totalPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, activeOrder, setActiveOrder, clearActiveOrder }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
