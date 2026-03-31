/**
 * Quantity counts for “unpaid” basket lines (what still needs payment or PATCH save).
 * - Incremental add: all cart lines are add-ons.
 * - Unpaid edit: only lines not already on the order.
 * - Normal shop: all lines.
 */
export function unpaidBasketQuantity(items, editOrderId, addingToOrderId) {
  const list = Array.isArray(items) ? items : [];
  if (addingToOrderId != null) {
    return list.reduce((s, i) => s + (i.quantity || 0), 0);
  }
  if (editOrderId != null) {
    return list.filter((i) => !i.fromExistingOrder).reduce((s, i) => s + (i.quantity || 0), 0);
  }
  return list.reduce((s, i) => s + (i.quantity || 0), 0);
}

/**
 * Bottom-nav badge: hide counts while the home gold card shows a paid Stripe order
 * and the user is not in add-to-order mode (avoids implying unpaid items when there are none).
 */
export function navBasketBadgeCount(items, editOrderId, addingToOrderId, suppressForPaidGoldCard) {
  const raw = unpaidBasketQuantity(items, editOrderId, addingToOrderId);
  if (suppressForPaidGoldCard && addingToOrderId == null && editOrderId == null) {
    return 0;
  }
  return raw;
}
