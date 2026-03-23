const BASE = import.meta.env.VITE_API_URL ?? '';

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
  { lineItems, customerName, note, pickupMinutes },
  fetchImpl = fetch
) {
  const res = await fetchImpl(`${BASE}/api/customer/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      line_items: lineItems,
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