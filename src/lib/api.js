const BASE = import.meta.env.VITE_API_URL ?? '';

const DEFAULT_MILKS = ['Full Fat', 'Regular'];

/** Build API line_items + modifiers from cart rows (checkout / PATCH). */
export function orderLineItemsFromCartItems(cartItems) {
  return cartItems.map((item) => {
    const mods = [];
    if (item.size && item.size !== 'Regular') mods.push({ name: item.size, price: 0 });
    if (item.milk && !DEFAULT_MILKS.includes(item.milk)) mods.push({ name: item.milk, price: 0 });
    if (item.syrup) mods.push({ name: `${item.syrup} syrup`, price: 0 });
    for (const a of item.alterations ?? []) mods.push({ name: a, price: 0 });
    return {
      catalog_object_id: item.catalogObjectId,
      quantity: item.quantity,
      item_name: item.name,
      unit_price: item.totalPrice,
      emoji: item.emoji,
      modifiers: mods,
    };
  });
}

export async function fetchModifierCategories() {
  const res = await fetch(`${BASE}/api/modifier-categories`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return data.ok ? (data.categories ?? []) : [];
}

export async function fetchCatalogItems() {
  const res = await fetch(`${BASE}/api/catalog-items`);
  if (!res.ok) throw new Error('Failed to load menu');
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to load menu');
  return data.items ?? [];
}

export async function submitOrder(
  { cartItems, customerName, note, pickupMinutes },
  fetchImpl = fetch
) {
  const line_items = orderLineItemsFromCartItems(cartItems);
  const res = await fetchImpl(`${BASE}/api/customer/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_items,
      customer_name: customerName,
      note,
      pickup_minutes: pickupMinutes ?? 15,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to place order');
  }
  return data;
}

export async function fetchCustomerOrders(authFetch, { status } = {}) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await authFetch(`${BASE}/api/customer/orders${q}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to load orders');
  }
  return data.orders ?? [];
}

export async function fetchCustomerOrder(authFetch, orderId) {
  const res = await authFetch(`${BASE}/api/customer/orders/${encodeURIComponent(orderId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to load order');
  }
  return data.order;
}

export async function updateCustomerOrder(authFetch, orderId, body) {
  const res = await authFetch(`${BASE}/api/customer/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Failed to update order');
  }
  return data.order;
}
