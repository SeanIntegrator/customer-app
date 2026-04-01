import { useCallback, useMemo, useState } from 'react';

export function useOrderLifecycleDomain() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  const [addingToOrderId, setAddingToOrderId] = useState(null);
  const [suppressNavBasketForPaidGoldCard, setSuppressNavBasketForPaidGoldCard] = useState(false);

  const clearActiveOrder = useCallback(() => setActiveOrder(null), []);
  const clearEditMode = useCallback(() => setEditOrderId(null), []);
  const clearAddingToOrder = useCallback(() => setAddingToOrderId(null), []);

  return useMemo(
    () => ({
      activeOrder,
      setActiveOrder,
      clearActiveOrder,
      editOrderId,
      setEditOrderId,
      clearEditMode,
      addingToOrderId,
      setAddingToOrderId,
      clearAddingToOrder,
      suppressNavBasketForPaidGoldCard,
      setSuppressNavBasketForPaidGoldCard,
    }),
    [
      activeOrder,
      editOrderId,
      addingToOrderId,
      suppressNavBasketForPaidGoldCard,
      clearActiveOrder,
      clearEditMode,
      clearAddingToOrder,
    ]
  );
}
