import { parseJsonSafe, pickErrorMessage, expectApiSuccess } from './apiEnvelope.js';

const BASE = import.meta.env.VITE_API_URL ?? '';

const DEFAULT_MILKS = ['Full Fat', 'Regular'];
/** @typedef {import('./types').CartLineItem} CartLineItem */
/** @typedef {import('./types').ApiLineItem} ApiLineItem */

function generateIdempotencyKey(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Build API line_items + modifiers from cart rows (checkout / PATCH). */
/** @param {CartLineItem[]} cartItems @returns {ApiLineItem[]} */
export function orderLineItemsFromCartItems(cartItems) {
  return cartItems.map((item) => {
    const mods = [];
    if (item.size && item.size !== 'Regular') mods.push({ name: item.size, price: 0 });
    if (item.milk && !DEFAULT_MILKS.includes(item.milk)) mods.push({ name: item.milk, price: 0 });
    // Syrup state is already the Square modifier name (e.g. "Vanilla Syrup"); do not append " syrup".
    if (item.syrup) mods.push({ name: String(item.syrup).trim(), price: 0 });
    for (const a of item.alterations ?? []) mods.push({ name: a, price: 0 });
    const cn = item.customerNote != null ? String(item.customerNote).trim() : '';
    return {
      catalog_object_id: item.catalogObjectId,
      quantity: item.quantity,
      item_name: item.name,
      unit_price: item.totalPrice,
      emoji: item.emoji,
      modifiers: mods,
      ...(cn ? { customer_note: cn } : {}),
    };
  });
}

export async function fetchModifierCategories() {
  const res = await fetch(`${BASE}/api/modifier-categories`);
  if (!res.ok) return [];
  const data = await parseJsonSafe(res);
  return data.ok ? (data.categories ?? []) : [];
}

export async function fetchCatalogItems() {
  const res = await fetch(`${BASE}/api/catalog-items`);
  const data = await expectApiSuccess(res, { fallbackError: 'Failed to load menu' });
  return data.items ?? [];
}

export async function createIncrementalCheckoutSession(authFetch, body) {
  const idempotencyKey = generateIdempotencyKey('incr');
  const res = await authFetch(`${BASE}/api/stripe/create-incremental-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
  const data = await expectApiSuccess(res, { fallbackError: 'Could not start add-on checkout' });
  return { sessionId: data.sessionId, url: data.url, difference: data.difference };
}

export async function cancelCustomerOrder(authFetch, orderId) {
  const res = await authFetch(`${BASE}/api/customer/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
  });
  return expectApiSuccess(res, { fallbackError: 'Could not cancel order' });
}

export async function fetchCustomerLoyalty(authFetch) {
  const res = await authFetch(`${BASE}/api/customer/loyalty`);
  return expectApiSuccess(res, { fallbackError: 'Failed to load loyalty' });
}

export async function fetchCustomerRewards(authFetch) {
  const res = await authFetch(`${BASE}/api/customer/rewards`);
  return expectApiSuccess(res, { fallbackError: 'Failed to load rewards' });
}

export async function fetchCustomerConfig(authFetch) {
  const res = await authFetch(`${BASE}/api/customer/config`);
  return expectApiSuccess(res, { fallbackError: 'Failed to load customer config' });
}

export async function createCheckoutSession(authFetch, body) {
  const idempotencyKey = generateIdempotencyKey('checkout');
  const res = await authFetch(`${BASE}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify(body),
  });
  const data = await expectApiSuccess(res, { fallbackError: 'Could not start checkout' });
  return { sessionId: data.sessionId, url: data.url };
}

export async function fetchOrderByCheckoutSession(authFetch, sessionId) {
  const q = new URLSearchParams({ session_id: sessionId });
  const res = await authFetch(`${BASE}/api/customer/order-by-checkout-session?${q}`);
  const data = await parseJsonSafe(res);
  if (res.status === 404 || res.status === 202 || data?.code === 'NOT_READY') {
    const err = new Error('Not ready');
    err.code = 'NOT_READY';
    throw err;
  }
  if (!res.ok || !data.ok) throw new Error(pickErrorMessage(data, 'Failed to load order'));
  return data.order;
}

export async function finalizeCheckoutSession(authFetch, sessionId) {
  const res = await authFetch(`${BASE}/api/stripe/finalize-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return expectApiSuccess(res, { fallbackError: 'Could not finalize checkout session' });
}

export async function submitOrder(
  { cartItems, customerName, pickupMinutes, allergens = [] },
  fetchImpl = fetch
) {
  const line_items = orderLineItemsFromCartItems(cartItems);
  const res = await fetchImpl(`${BASE}/api/customer/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_items,
      customer_name: customerName,
      pickup_minutes: pickupMinutes ?? 15,
      allergens,
    }),
  });
  const data = await expectApiSuccess(res, { fallbackError: 'Failed to place order' });
  return data;
}

export async function fetchCustomerOrders(authFetch, { status, days } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (days != null && days !== '') params.set('days', String(days));
  const q = params.toString() ? `?${params.toString()}` : '';
  const res = await authFetch(`${BASE}/api/customer/orders${q}`);
  const data = await expectApiSuccess(res, { fallbackError: 'Failed to load orders' });
  return data.orders ?? [];
}

export async function fetchCustomerOrder(authFetch, orderId) {
  const res = await authFetch(`${BASE}/api/customer/orders/${encodeURIComponent(orderId)}`);
  const data = await expectApiSuccess(res, { fallbackError: 'Failed to load order' });
  return data.order;
}

export async function updateCustomerOrder(authFetch, orderId, body) {
  const res = await authFetch(`${BASE}/api/customer/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await expectApiSuccess(res, { fallbackError: 'Failed to update order' });
  return data.order;
}

export const GOOGLE_REVIEW_PLACE_URL =
  'https://search.google.com/local/writereview?placeid=ChIJX2BkhKih2EcRPwV36PubVtA';

/**
 * @param {typeof fetch} fetchImpl
 * @param {{ order_id: string | number, rating: number, comment?: string }} body
 */
export async function submitOrderFeedback(fetchImpl, body) {
  const res = await fetchImpl(`${BASE}/api/order-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: body.order_id,
      rating: body.rating,
      comment: body.comment ?? '',
    }),
  });
  const data = await expectApiSuccess(res, { fallbackError: 'Could not send feedback' });
  return {
    shouldShowGooglePrompt: Boolean(data.shouldShowGooglePrompt),
    googleReviewUrl: data.googleReviewUrl || GOOGLE_REVIEW_PLACE_URL,
  };
}
