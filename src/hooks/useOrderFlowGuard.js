import { useMemo } from 'react';
import { useBlocker } from 'react-router-dom';

function orderFlowPath(p) {
  return p === '/order' || p.startsWith('/order/menu/');
}

export function useOrderFlowGuard({ addingToOrderId, editOrderId, cartItems }) {
  const basketDirty = useMemo(
    () =>
      (addingToOrderId != null && cartItems.length > 0) ||
      (editOrderId != null && cartItems.some((i) => !i.fromExistingOrder)),
    [addingToOrderId, editOrderId, cartItems]
  );

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!basketDirty) return false;
    const cur = currentLocation.pathname;
    const next = nextLocation.pathname;
    return orderFlowPath(cur) && !orderFlowPath(next);
  });

  const qtyByCatalogId = useMemo(() => {
    const m = new Map();
    for (const line of cartItems) {
      const cid = line.catalogObjectId;
      if (!cid) continue;
      const fromOrder =
        editOrderId != null &&
        (line.fromExistingOrder === true || String(line.cartId || '').startsWith('edit-'));
      const cur = m.get(cid) || { basket: 0, ordered: 0 };
      if (fromOrder) cur.ordered += line.quantity;
      else cur.basket += line.quantity;
      m.set(cid, cur);
    }
    return m;
  }, [cartItems, editOrderId]);

  return { blocker, qtyByCatalogId };
}
