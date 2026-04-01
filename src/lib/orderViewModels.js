/**
 * Pure mappers: API/customer order shapes → Home gold card + cart activeOrder snapshot.
 * ID matching: prefer numeric equality for db ids; Square ids compared as strings.
 */

import { remainingMinutesUntilPickup } from './pickup';

/**
 * Post-checkout success: minutes until pickup for OrderSuccess display.
 * When `pickup_time` is missing, defaults to 15 (differs from `remainingMinutesUntilPickup`, which uses 10).
 * @param {{ pickup_time?: string | null }} order
 * @returns {number}
 */
export function pickupMinutesFromOrderForSuccess(order) {
  if (!order?.pickup_time) return 15;
  const ms = new Date(order.pickup_time).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

/**
 * @param {object} serverLiveOrder — first pending/confirmed order from `fetchCustomerOrders`
 * @returns {object | null}
 */
export function buildGoldCardModelFromCustomerApiOrder(serverLiveOrder) {
  if (!serverLiveOrder) return null;
  return {
    id: serverLiveOrder.id,
    status: serverLiveOrder.status,
    total_amount: serverLiveOrder.total_amount,
    pickupMinutes: remainingMinutesUntilPickup(serverLiveOrder.pickup_time),
    items: (serverLiveOrder.items || []).map((it) => ({
      name: it.item_name,
      emoji: it.item_emoji || '☕',
      quantity: it.quantity,
      totalPrice: it.unit_price,
      size: 'Regular',
      milk: 'Full Fat',
    })),
    editable: serverLiveOrder.status === 'pending' || serverLiveOrder.status === 'confirmed',
    is_paid_via_stripe: Boolean(serverLiveOrder.is_paid_via_stripe),
  };
}

/**
 * Client-side active order (after checkout) when server list is empty or not yet refreshed.
 * @param {object | null} activeOrder
 * @returns {object | null}
 */
export function buildGoldCardModelFromActiveOrder(activeOrder) {
  if (!activeOrder || (activeOrder.orderId == null && activeOrder.dbOrderId == null)) return null;
  const id = activeOrder.dbOrderId ?? activeOrder.orderId;
  const at = Number(activeOrder.total);
  return {
    id,
    status: 'confirmed',
    total_amount: Number.isFinite(at) ? at : 0,
    pickupMinutes: activeOrder.pickupMinutes ?? 10,
    items: activeOrder.items || [],
    editable: true,
    is_paid_via_stripe: true,
  };
}

/**
 * Home hero / bridging CTA: prefer server order, else fall back to cart `activeOrder`.
 * @param {object | null} serverLiveOrder
 * @param {object | null} activeOrder
 * @returns {object | null}
 */
export function buildHomeGoldCardModel(serverLiveOrder, activeOrder) {
  if (serverLiveOrder) return buildGoldCardModelFromCustomerApiOrder(serverLiveOrder);
  return buildGoldCardModelFromActiveOrder(activeOrder);
}

/**
 * Full snapshot for cart + KDS-complete matching after Stripe return (`OrderPaymentSuccess`).
 * @param {object | null} o — API `order` object
 * @returns {object | null}
 */
export function buildActiveOrderSnapshotFromApiOrder(o) {
  if (!o?.id) return null;
  const total = Number(o.total_amount);
  return {
    dbOrderId: o.id,
    orderId: o.id,
    squareOrderId: o.square_order_id,
    total: Number.isFinite(total) ? total : 0,
    pickupMinutes: pickupMinutesFromOrderForSuccess(o),
    placedAt: Date.now(),
    items: (o.items || []).map((it) => ({
      name: it.item_name,
      emoji: it.item_emoji || '☕',
      quantity: it.quantity,
      totalPrice: it.unit_price,
      size: 'Regular',
      milk: 'Full Fat',
    })),
  };
}
