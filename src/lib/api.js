/**
 * API wrappers for the Express backend.
 * In development, Vite proxies /api/* → http://localhost:3000.
 */

export async function fetchModifierCategories() {
  const res = await fetch('/api/modifier-categories');
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return data.ok ? (data.categories ?? []) : [];
}

export async function fetchCatalogItems() {
  const res = await fetch('/api/catalog-items');
  if (!res.ok) throw new Error('Failed to load menu');
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Failed to load menu');
  return data.items ?? [];
}

export async function submitOrder({ lineItems, customerName, note, pickupMinutes }) {
  const res = await fetch('/api/create-order', {
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
